import json
import argparse
import os
import sys
from pathlib import Path

import ctranslate2
import demucs
import demucs.apply as demucs_apply
from demucs.apply import apply_model
from demucs.audio import AudioFile, save_audio
from demucs.pretrained import get_model
import faster_whisper
import torch
import torchaudio
import whisperx
from lingua import LanguageDetectorBuilder
from whisperx.alignment import DEFAULT_ALIGN_MODELS_HF, DEFAULT_ALIGN_MODELS_TORCH
from karaoke_worker.lyrics import approximate_line_word_timings, comparable_words, localize_lyrics, monotonic_timing_blocks, normalize_generated_word_gaps


language_detector = LanguageDetectorBuilder.from_all_languages().build()


def emit(payload: dict) -> None:
    print(json.dumps(payload), flush=True)


def healthcheck() -> None:
    packages = [
        "ctranslate2",
        "demucs",
        "faster-whisper",
        "torch",
        "torchaudio",
        "whisperx",
    ]
    emit(
        {
            "status": "ready",
            "workerVersion": "0.4.11",
            "dependencies": packages,
        }
    )


def emit_progress(stage: str, progress: float, message: str) -> None:
    emit({"type": "project.progress", "stage": stage, "progress": progress, "message": message})


def milliseconds(seconds: float) -> int:
    return round(seconds * 1000)


def add_gap_tokens(words: list[dict]) -> None:
    normalize_generated_word_gaps(words)

def separate(source: Path, project_directory: Path, demucs_model: str) -> None:
    device = (
        "cuda"
        if torch.cuda.is_available()
        else "mps"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available()
        else "cpu"
    )
    jobs = 0 if device == "cuda" else (os.cpu_count() or 1)
    emit_progress("separation", 0.0, f"Separando vocais e instrumental ({device.upper()})")
    model = get_model(demucs_model)
    wav = AudioFile(source).read(
        streams=0,
        samplerate=model.samplerate,
        channels=model.audio_channels,
    )
    reference = wav.mean(0)
    wav = (wav - reference.mean()) / reference.std()

    # Demucs' pip package does not include its newer `demucs.api` wrapper. Its
    # native API exposes a tqdm iterable instead; replace it with a lightweight
    # reporter so the desktop UI receives real per-segment progress updates.
    original_tqdm = demucs_apply.tqdm.tqdm

    class ProgressReporter:
        def __init__(self, futures, **_kwargs):
            self.futures = list(futures)

        def __iter__(self):
            total = max(len(self.futures), 1)
            for index, future in enumerate(self.futures):
                percent = min(99, round(index * 100 / total))
                emit_progress("separation", percent, f"Separando vocais e instrumental ({percent}%)")
                yield future

    demucs_apply.tqdm.tqdm = ProgressReporter
    try:
        sources = apply_model(
            model,
            wav[None],
            device=device,
            shifts=1,
            split=True,
            progress=True,
            num_workers=jobs,
        )[0]
    finally:
        demucs_apply.tqdm.tqdm = original_tqdm

    sources = sources * reference.std() + reference.mean()
    stems = dict(zip(model.sources, sources))
    vocals = stems.get("vocals")
    instrumental = sum(stem for name, stem in stems.items() if name != "vocals")
    if vocals is None or instrumental is None:
        raise RuntimeError("Demucs did not produce vocals and instrumental stems")
    audio_directory = project_directory / "audio"
    audio_directory.mkdir(parents=True, exist_ok=True)
    options = {"samplerate": model.samplerate, "clip": "rescale", "as_float": False, "bits_per_sample": 24}
    save_audio(vocals, str(audio_directory / "vocals.wav"), **options)
    save_audio(instrumental, str(audio_directory / "instrumental.wav"), **options)
    del sources, stems, vocals, instrumental, wav, reference, model
    if device == "cuda":
        torch.cuda.empty_cache()
    emit_progress("separation", 100.0, "Stems separados")


def compute_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def is_cuda_out_of_memory(error: Exception) -> bool:
    message = str(error).casefold()
    return "out of memory" in message or "cuda oom" in message


def whisperx_align_with_fallback(vocals: Path, segments: list[dict], language: str, message: str) -> dict:
    """Prefer GPU alignment, but retry on CPU when the GPU lacks free VRAM."""
    device = compute_device()
    for attempt_device in ([device, "cpu"] if device == "cuda" else [device]):
        align_model = None
        try:
            emit_progress("transcription", 35.0, message if attempt_device == device else "Memória GPU insuficiente; alinhando palavras na CPU")
            align_model, metadata = whisperx.load_align_model(language_code=language, device=attempt_device)
            return whisperx.align(segments, align_model, metadata, str(vocals), attempt_device, return_char_alignments=False)
        except Exception as error:
            if attempt_device != "cuda" or not is_cuda_out_of_memory(error):
                raise
            torch.cuda.empty_cache()
        finally:
            if align_model is not None:
                del align_model
            if attempt_device == "cuda":
                torch.cuda.empty_cache()
    raise RuntimeError("WhisperX alignment failed")


def lyric_language(lyrics: str) -> str:
    """Choose WhisperX's alignment model without sending lyrics to ASR."""
    detected = language_detector.detect_language_of(lyrics)
    if detected is None or detected.iso_code_639_1 is None:
        return "en"
    language = detected.iso_code_639_1.name.lower()
    supported = {*DEFAULT_ALIGN_MODELS_TORCH, *DEFAULT_ALIGN_MODELS_HF}
    return language if language in supported else "en"


def build_phrases(aligned_segments: list[dict]) -> list[dict]:
    return build_phrases_with_fallback(aligned_segments, aligned_segments)


def distribute_words(text: str, start: float, end: float) -> list[dict]:
    tokens = text.split()
    if not tokens or end <= start:
        return []
    total_weight = sum(max(len(token), 1) for token in tokens)
    cursor = start
    words = []
    for index, token in enumerate(tokens):
        boundary = end if index == len(tokens) - 1 else cursor + (end - start) * max(len(token), 1) / total_weight
        words.append({"word": token, "start": cursor, "end": boundary})
        cursor = boundary
    return words


def build_phrases_with_fallback(aligned_segments: list[dict], source_segments: list[dict]) -> list[dict]:
    phrases = []
    for segment_index, source in enumerate(source_segments):
        segment = aligned_segments[segment_index] if segment_index < len(aligned_segments) else {}
        source_text = str(source.get("text", "")).strip()
        source_start = float(source.get("start", 0))
        source_end = float(source.get("end", source_start))
        aligned_words = segment.get("words", [])
        source_tokens = source_text.split()
        timed_words = [
            word
            for word in aligned_words
            if word.get("start") is not None
            and word.get("end") is not None
            and str(word.get("word", "")).strip()
            and word["end"] > word["start"]
        ]
        if len(timed_words) != len(source_tokens):
            timed_words = distribute_words(source_text, source_start, source_end)
        words = []
        for word_index, word in enumerate(timed_words):
            start = word.get("start")
            end = word.get("end")
            text = source_tokens[word_index] if word_index < len(source_tokens) else str(word.get("word", "")).strip()
            if start is None or end is None or not text or end <= start:
                continue
            words.append({"id": f"word-{segment_index + 1}-{word_index + 1}", "text": text, "start": milliseconds(float(start)), "end": milliseconds(float(end))})
        if not words:
            continue
        add_gap_tokens(words)
        phrases.append({"id": f"phrase-{segment_index + 1}", "text": source_text, "start": words[0]["start"], "end": words[-1]["end"], "words": words})
    return phrases


def set_phrase_boundary(phrase: dict, boundary: int, side: str) -> None:
    words = [word for word in phrase["words"] if word.get("type") != "gap"]
    if side == "end":
        for word in words:
            if word["end"] > boundary:
                word["end"] = max(word["start"] + 1, boundary)
        phrase["end"] = max(phrase["start"] + 1, boundary)
    else:
        for word in words:
            if word["start"] < boundary:
                word["start"] = min(word["end"] - 1, boundary)
        phrase["start"] = min(phrase["end"] - 1, boundary)
    add_gap_tokens(words)
    phrase["words"] = words


def normalize_phrase_boundaries(phrases: list[dict]) -> list[dict]:
    """Keep consecutive lyric lines ordered when alignment crosses a guide boundary."""
    normalized: list[dict] = []
    for phrase in phrases:
        if not normalized:
            normalized.append(phrase)
            continue
        previous = normalized[-1]
        if phrase["start"] >= previous["end"]:
            normalized.append(phrase)
            continue
        overlap_start = max(previous["start"], phrase["start"])
        overlap_end = min(previous["end"], phrase["end"])
        boundary = round((overlap_start + overlap_end) / 2)
        set_phrase_boundary(previous, boundary, "end")
        set_phrase_boundary(phrase, boundary, "start")
        normalized.append(phrase)
    return normalized


def forced_align(vocals: Path, segments: list[dict], language: str) -> list[dict]:
    """Align lyric windows to the vocal stem with WhisperX word timestamps."""
    aligned = whisperx_align_with_fallback(vocals, segments, language, "Alinhando palavras da letra aos vocais")
    phrases = normalize_phrase_boundaries(
        build_phrases_with_fallback(aligned.get("segments", []), segments)
    )
    if not phrases:
        raise RuntimeError("Could not align any lyric words to the vocal audio")
    return phrases


def reconstruct_provided_lyrics(plan: dict, aligned_regions: list[dict]) -> list[dict]:
    """Rebuild every supplied line after WhisperX aligned its broad region."""
    phrases = []
    regions = plan["regions"] or [{
        "start": 0.0,
        "end": 0.0,
        "line_start": 0,
        "line_end": len(plan["lines"]),
        "lines": plan["lines"],
    }]
    for region_index, region in enumerate(regions):
        aligned = aligned_regions[region_index] if region_index < len(aligned_regions) else {}
        words = [
            word for word in aligned.get("words", [])
            if word.get("start") is not None and word.get("end") is not None
            and float(word["end"]) > float(word["start"])
        ]
        approximate_lines = approximate_line_word_timings(
            region["lines"], float(region["start"]), float(region["end"])
        )
        aligned_lines = []
        cursor = 0
        for line_index in range(region["line_start"], region["line_end"]):
            token_count = len(comparable_words(plan["lines"][line_index]))
            line_words = words[cursor:cursor + token_count]
            cursor += token_count
            aligned_lines.append(line_words if token_count and len(line_words) == token_count else None)
        # WhisperX can return a repeated phrase occurrence out of sequence even
        # when word counts look valid. Reject that entire regional result rather
        # than assigning the official lines to a temporally reordered chorus.
        valid_alignment = all(line_words for line_words in aligned_lines)
        if valid_alignment:
            line_starts = [float(line_words[0]["start"]) for line_words in aligned_lines]
            line_ends = [float(line_words[-1]["end"]) for line_words in aligned_lines]
            valid_alignment = all(
                line_starts[index] >= line_ends[index - 1]
                for index in range(1, len(aligned_lines))
            )
            valid_alignment = valid_alignment and all(
                float(region["start"]) <= start <= end <= float(region["end"])
                for start, end in zip(line_starts, line_ends)
            )
        for line_index in range(region["line_start"], region["line_end"]):
            text = plan["lines"][line_index]
            line_words = aligned_lines[line_index - region["line_start"]]
            valid = bool(valid_alignment and line_words and len(line_words) == len(text.split()))
            approximate_words = approximate_lines[line_index - region["line_start"]]
            phrase = {
                "id": f"phrase-{line_index + 1}",
                "text": text,
                "alignment_status": "aligned" if valid else "approximate",
                "confidence": 1.0 if valid else 0.0,
                "search_start": milliseconds(float(region["start"])),
                "search_end": milliseconds(float(region["end"])),
                "words": [],
            }
            source_words = line_words if valid and len(line_words) == len(text.split()) else approximate_words
            phrase_words = [
                {
                    "id": f"word-{line_index + 1}-{word_index + 1}",
                    "text": source_word,
                    "start": milliseconds(float(word["start"])),
                    "end": milliseconds(float(word["end"])),
                }
                for word_index, (source_word, word) in enumerate(zip(text.split(), source_words))
            ]
            if phrase_words:
                add_gap_tokens(phrase_words)
                phrase.update({"start": phrase_words[0]["start"], "end": phrase_words[-1]["end"], "words": phrase_words})
            phrases.append(phrase)
    return enforce_monotonic_provided_phrase_order(phrases)


def enforce_monotonic_provided_phrase_order(phrases: list[dict]) -> list[dict]:
    """Repair only temporal inversions; official phrase order is immutable."""
    index = 1
    while index < len(phrases):
        if phrases[index]["start"] >= phrases[index - 1]["end"]:
            index += 1
            continue
        block_start = index - 1
        maximum_end = max(phrases[block_start]["end"], phrases[index]["end"])
        block_end = index + 1
        while block_end < len(phrases) and phrases[block_end]["start"] < maximum_end:
            maximum_end = max(maximum_end, phrases[block_end]["end"])
            block_end += 1
        left = phrases[block_start - 1]["end"] if block_start else phrases[block_start]["start"]
        right = phrases[block_end]["start"] if block_end < len(phrases) else maximum_end
        timed_lines = approximate_line_word_timings(
            [phrase["text"] for phrase in phrases[block_start:block_end]],
            left / 1000,
            right / 1000,
        )
        for phrase, timed_words in zip(phrases[block_start:block_end], timed_lines):
            words = [
                {
                    "id": f"{phrase['id']}-approximate-{index + 1}",
                    "text": text,
                    "start": milliseconds(float(word["start"])),
                    "end": milliseconds(float(word["end"])),
                }
                for index, (text, word) in enumerate(zip(phrase["text"].split(), timed_words))
            ]
            add_gap_tokens(words)
            phrase.update(
                {
                    "start": words[0]["start"],
                    "end": words[-1]["end"],
                    "words": words,
                    "alignment_status": "approximate",
                    "confidence": 0.0,
                }
            )
        # Recheck from the first repaired boundary; later blocks must use this
        # new stable end rather than a stale timestamp from WhisperX.
        index = max(1, block_start)
    return phrases


def forced_align_provided_lyrics(vocals: Path, plan: dict, language: str) -> list[dict]:
    """Force-align official regional text, then restore original line boundaries."""
    regions = plan["regions"]
    active_regions = [region for region in regions if float(region["end"]) > float(region["start"])]
    if not active_regions:
        return reconstruct_provided_lyrics(plan, [])
    aligned = whisperx_align_with_fallback(vocals, active_regions, language, "Alinhando palavras da letra fornecida aos vocais")
    aligned_by_region = []
    aligned_segments = iter(aligned.get("segments", []))
    for region in regions:
        aligned_by_region.append(next(aligned_segments, {}) if float(region["end"]) > float(region["start"]) else {})
    return reconstruct_provided_lyrics(plan, aligned_by_region)


def save_raw_whisper_output(
    project_directory: Path,
    whisper_model_path: Path,
    info: object,
    segments: list[dict],
    settings: dict | None = None,
) -> None:
    """Keep the pre-alignment ASR result for pipeline-quality comparisons."""
    raw_output = {
        "format": "karaokai.whisper-raw.v1",
        "model": whisper_model_path.name,
        "language": getattr(info, "language", None),
        "languageProbability": getattr(info, "language_probability", None),
        "segments": segments,
    }
    if settings:
        raw_output["settings"] = settings
    cache_directory = project_directory / "cache"
    cache_directory.mkdir(parents=True, exist_ok=True)
    (cache_directory / "whisper-raw.json").write_text(
        json.dumps(raw_output, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def transcribe(project_directory: Path, whisper_model_path: Path, lyrics: str | None = None) -> None:
    vocals = project_directory / "audio" / "vocals.wav"
    if lyrics and lyrics.strip():
        emit_progress("transcription", 0.0, "Localizando frases vocais com o modelo Whisper selecionado")
        model = faster_whisper.WhisperModel(str(whisper_model_path), device="cpu", compute_type="int8")
        language = lyric_language(lyrics)
        use_vad = False
        whisper_segments, info = model.transcribe(str(vocals), language=language, word_timestamps=True, vad_filter=use_vad)
        timing_segments = [
            {"start": segment.start, "end": segment.end, "text": segment.text.strip(), "words": [{"word": word.word, "start": word.start, "end": word.end, "probability": getattr(word, "probability", None)} for word in (segment.words or [])]}
            for segment in whisper_segments
            if segment.text.strip() and segment.end > segment.start
        ]
        save_raw_whisper_output(
            project_directory,
            whisper_model_path,
            info,
            timing_segments,
            {"language": language, "wordTimestamps": True, "vadFilter": use_vad},
        )
        emit_progress("transcription", 12.0, "Associando a letra fornecida às frases vocais")
        plan = localize_lyrics(lyrics.strip(), timing_segments)
        debug = {"asr": {"language": language, "wordTimestamps": True, "vadFilter": use_vad}, "anchors": plan["anchors"], "tokenAlignment": plan["alignment"], "regions": plan["regions"], "unresolvedLines": [], "lowConfidenceLines": []}
        phrases = forced_align_provided_lyrics(vocals, plan, language)
        debug["unresolvedLines"] = [phrase["text"] for phrase in phrases if phrase["alignment_status"] == "unresolved"]
        debug["lowConfidenceLines"] = [phrase["text"] for phrase in phrases if phrase["confidence"] < 0.75]
        (project_directory / "cache" / "lyrics-alignment-debug.json").write_text(json.dumps(debug, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        emit_progress("transcription", 0.0, "Transcrevendo vocais com o modelo Whisper selecionado")
        model = faster_whisper.WhisperModel(str(whisper_model_path), device="cpu", compute_type="int8")
        segments, info = model.transcribe(str(vocals), vad_filter=False)
        alignment_input = [{"start": segment.start, "end": segment.end, "text": segment.text.strip()} for segment in segments if segment.text.strip() and segment.end > segment.start]
        if not alignment_input:
            raise RuntimeError("Whisper did not detect any vocal phrases")
        save_raw_whisper_output(project_directory, whisper_model_path, info, alignment_input)
        phrases = forced_align(vocals, alignment_input, info.language)
    instrumental = project_directory / "audio" / "instrumental.wav"
    metadata = torchaudio.info(str(instrumental))
    result = {
        "duration": milliseconds(metadata.num_frames / metadata.sample_rate),
        "phrases": phrases,
    }
    (project_directory / "cache" / "transcription.json").write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    emit_progress("transcription", 100.0, "Transcrição e alinhamento concluídos")
    emit_progress("subtitles", 100.0, "Legendas sincronizadas geradas")


def project_pipeline(source: str, project_directory: str, demucs_model: str, whisper_model_path: str, lyrics: str | None = None) -> None:
    project = Path(project_directory)
    separate(Path(source), project, demucs_model)
    transcribe(project, Path(whisper_model_path), lyrics)
    emit({"type": "project.completed"})


def main() -> None:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--project-pipeline", action="store_true")
    parser.add_argument("--source")
    parser.add_argument("--project-directory")
    parser.add_argument("--demucs-model", default="htdemucs")
    parser.add_argument("--whisper-model-path")
    parser.add_argument("--lyrics-path")
    parser.add_argument("--separate", action="store_true")
    parser.add_argument("--transcribe", action="store_true")
    arguments, _ = parser.parse_known_args()
    if "--healthcheck" in sys.argv:
        healthcheck()
        return

    if arguments.project_pipeline or arguments.separate or arguments.transcribe:
        try:
            if not arguments.project_directory:
                raise RuntimeError("Missing pipeline arguments")
            project = Path(arguments.project_directory)
            lyrics = Path(arguments.lyrics_path).read_text(encoding="utf-8") if arguments.lyrics_path else None
            if arguments.project_pipeline:
                if not arguments.source or not arguments.whisper_model_path:
                    raise RuntimeError("Missing pipeline arguments")
                project_pipeline(arguments.source, arguments.project_directory, arguments.demucs_model, arguments.whisper_model_path, lyrics)
            elif arguments.separate:
                if not arguments.source:
                    raise RuntimeError("Missing source for separation")
                separate(Path(arguments.source), project, arguments.demucs_model)
            else:
                if not arguments.whisper_model_path:
                    raise RuntimeError("Missing Whisper model for transcription")
                transcribe(project, Path(arguments.whisper_model_path), lyrics)
            emit({"type": "project.completed"})
        except Exception as error:
            emit({"type": "project.failed", "error": str(error)})
            raise
        return

    for line in sys.stdin:
        request = json.loads(line)
        emit(
            {
                "jobId": request.get("jobId"),
                "type": "job.failed",
                "error": {
                    "code": "WORKER_PIPELINE_NOT_IMPLEMENTED",
                    "stage": "worker",
                    "recoverable": False,
                },
            }
        )


if __name__ == "__main__":
    main()
