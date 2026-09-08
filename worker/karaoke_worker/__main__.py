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
            "workerVersion": "0.3.1",
            "dependencies": packages,
        }
    )


def emit_progress(stage: str, progress: float, message: str) -> None:
    emit({"type": "project.progress", "stage": stage, "progress": progress, "message": message})


def milliseconds(seconds: float) -> int:
    return round(seconds * 1000)


def add_gap_tokens(words: list[dict]) -> None:
    normalized: list[dict] = []
    for word in words:
        current = dict(word)
        if normalized:
            previous = normalized[-1]
            if current["start"] > previous["end"]:
                normalized.append(
                    {
                        "id": f"gap-{previous['id']}-{current['id']}",
                        "type": "gap",
                        "text": "",
                        "start": previous["end"],
                        "end": current["start"],
                    }
                )
            elif current["start"] < previous["end"]:
                boundary = round((previous["end"] + current["start"]) / 2)
                previous["end"] = boundary
                current["start"] = boundary
        normalized.append(current)
    words[:] = normalized

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
    emit_progress("separation", 100.0, "Stems separados")


def transcribe(project_directory: Path, whisper_model_path: Path) -> None:
    emit_progress("transcription", 0.0, "Transcrevendo vocais")
    vocals = project_directory / "audio" / "vocals.wav"
    model = faster_whisper.WhisperModel(str(whisper_model_path), device="cpu", compute_type="int8")
    segments, _ = model.transcribe(str(vocals), word_timestamps=True, vad_filter=True)
    phrases = []
    for index, segment in enumerate(segments):
        words = []
        for word_index, word in enumerate(segment.words or []):
            if word.start is None or word.end is None:
                continue
            text = word.word.strip()
            start = milliseconds(word.start)
            end = milliseconds(word.end)
            if not text or end <= start:
                continue
            words.append({"id": f"word-{index + 1}-{word_index + 1}", "text": text, "start": start, "end": end})
        if not words:
            continue
        add_gap_tokens(words)
        phrases.append({"id": f"phrase-{index + 1}", "text": " ".join(word["text"] for word in words if word.get("type") != "gap"), "start": words[0]["start"], "end": words[-1]["end"], "words": words})
        emit_progress("transcription", min(95.0, 10.0 + (index / (index + 8)) * 85.0), f"Transcrevendo frase {index + 1}")
    instrumental = project_directory / "audio" / "instrumental.wav"
    metadata = torchaudio.info(str(instrumental))
    result = {
        "duration": milliseconds(metadata.num_frames / metadata.sample_rate),
        "phrases": phrases,
    }
    (project_directory / "cache" / "transcription.json").write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    emit_progress("transcription", 100.0, "Transcrição concluída")
    emit_progress("subtitles", 100.0, "Legendas sincronizadas geradas")


def project_pipeline(source: str, project_directory: str, demucs_model: str, whisper_model_path: str) -> None:
    project = Path(project_directory)
    separate(Path(source), project, demucs_model)
    transcribe(project, Path(whisper_model_path))
    emit({"type": "project.completed"})


def main() -> None:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--project-pipeline", action="store_true")
    parser.add_argument("--source")
    parser.add_argument("--project-directory")
    parser.add_argument("--demucs-model", default="htdemucs")
    parser.add_argument("--whisper-model-path")
    arguments, _ = parser.parse_known_args()
    if "--healthcheck" in sys.argv:
        healthcheck()
        return

    if arguments.project_pipeline:
        try:
            if not arguments.source or not arguments.project_directory or not arguments.whisper_model_path:
                raise RuntimeError("Missing pipeline arguments")
            project_pipeline(arguments.source, arguments.project_directory, arguments.demucs_model, arguments.whisper_model_path)
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
