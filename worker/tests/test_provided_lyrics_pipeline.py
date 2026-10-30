"""Exercise worker orchestration with the ML runtime replaced by test doubles."""

import ast
import __future__
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, call

from karaoke_worker.fine_alignment import fine_alignment_result, phrase_window, refine_provided_phrases


def worker_functions():
    # Load the actual orchestration functions without importing GPU/ML packages.
    source = Path(__file__).parents[1] / "karaoke_worker" / "__main__.py"
    tree = ast.parse(source.read_text(encoding="utf-8"))
    functions = ast.Module(body=[node for node in tree.body if isinstance(node, ast.FunctionDef)], type_ignores=[])
    namespace = {"Path": Path, "json": json}
    exec(compile(functions, str(source), "exec", flags=__future__.annotations.compiler_flag), namespace)
    return namespace


class ProvidedLyricsPipelineTests(unittest.TestCase):
    def namespace(self, device="cpu"):
        ns = worker_functions()
        ns.update(
            compute_device=lambda: device,
            emit_progress=Mock(),
            torchaudio=SimpleNamespace(info=Mock(return_value=object())),
            torch=SimpleNamespace(cuda=SimpleNamespace(empty_cache=Mock())),
            whisperx=SimpleNamespace(load_align_model=Mock(side_effect=lambda **kw: (kw["device"], {}))),
            refine_provided_phrases=refine_provided_phrases,
        )
        return ns

    def phrases(self):
        return [
            {"id": str(i), "text": "Hello", "start": start, "end": start + 1000,
             "words": [{"id": f"w-{i}", "text": "Hello", "start": start, "end": start + 1000}]}
            for i, start in enumerate((2000, 5000))
        ]

    def test_phrase_audio_uses_all_sentences_and_recovers_untimed_word(self):
        ns = self.namespace()
        audio = SimpleNamespace(shape=(64000,))
        waveform = SimpleNamespace(numel=lambda: 64000, mean=lambda **kw: audio)
        metadata = SimpleNamespace(num_frames=160000, sample_rate=16000)
        ns["torchaudio"].load = Mock(return_value=(waveform, 16000))
        ns.update(fine_alignment_result=fine_alignment_result, phrase_window=phrase_window)
        align = Mock(return_value={"segments": [
            {"words": [{"word": "Hello.", "start": 1.1, "end": 1.5}]},
            {"words": [{"word": "23"}, {"word": "world!", "start": 2.0, "end": 2.5}]},
        ]})
        result = ns["align_phrase_audio"](Path("vocals.wav"), "Hello.  23\nworld!", 2000, 4000, align, metadata)
        self.assertEqual(result["words"], [
            {"text": "Hello.", "start": 2100, "end": 2500},
            {"text": "23", "start": 2500, "end": 3000},
            {"text": "world!", "start": 3000, "end": 3500},
        ])
        self.assertEqual(align.call_args.args[1], [{"start": 0.0, "end": 4.0, "text": "Hello. 23 world!"}])
        ns["torchaudio"].load.assert_called_once_with("vocals.wav", frame_offset=16000, num_frames=64000)

    def test_model_is_loaded_once_and_phrase_failure_does_not_stop_pass(self):
        ns = self.namespace()
        ns["align_phrase_audio"] = Mock(side_effect=[
            ValueError("Incomplete timings"),
            {"start": 5200, "end": 5800, "words": [{"text": "Hello", "start": 5200, "end": 5800}]},
        ])
        phrases = self.phrases()
        result = ns["fine_align_provided_lyrics"](Path("vocals.wav"), phrases, "en")
        self.assertEqual(result[0], phrases[0])
        self.assertEqual(result[1]["start"], 5200)
        ns["whisperx"].load_align_model.assert_called_once_with(language_code="en", device="cpu")
        self.assertEqual(ns["align_phrase_audio"].call_count, 2)
        self.assertEqual(ns["emit_progress"].call_args.args[1], 95.0)

    def test_cuda_failure_retries_pass_on_cpu(self):
        ns = self.namespace("cuda")
        ns["align_phrase_audio"] = Mock(side_effect=[
            RuntimeError("CUDA out of memory"),
            {"start": 2200, "end": 2800, "words": [{"text": "Hello", "start": 2200, "end": 2800}]},
            {"start": 5200, "end": 5800, "words": [{"text": "Hello", "start": 5200, "end": 5800}]},
        ])
        phrases = self.phrases()
        result = ns["fine_align_provided_lyrics"](Path("vocals.wav"), phrases, "en")
        self.assertEqual([p["start"] for p in result], [2200, 5200])
        self.assertEqual([p["start"] for p in phrases], [2000, 5000])
        self.assertEqual(ns["whisperx"].load_align_model.call_args_list, [
            call(language_code="en", device="cuda"), call(language_code="en", device="cpu"),
        ])

    def test_refined_phrases_are_saved_before_transcription_completes(self):
        ns = self.namespace()
        model = SimpleNamespace(transcribe=Mock(return_value=([], SimpleNamespace(language="en"))))
        phrases = self.phrases()
        refined = [{**p, "alignment_status": "aligned", "confidence": 1.0} for p in phrases]
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / "cache").mkdir()

            def refine(vocals, initial, language):
                self.assertFalse((project / "cache" / "transcription.json").exists())
                self.assertEqual(initial, phrases)
                return refined

            ns.update(
                faster_whisper=SimpleNamespace(WhisperModel=Mock(return_value=model)),
                lyric_language=Mock(return_value="en"), save_raw_whisper_output=Mock(),
                localize_lyrics=Mock(return_value={"anchors": [], "alignment": [], "regions": []}),
                forced_align_provided_lyrics=Mock(return_value=phrases),
                fine_align_provided_lyrics=Mock(side_effect=refine),
            )
            ns["torchaudio"].info.return_value = SimpleNamespace(num_frames=160000, sample_rate=16000)
            ns["transcribe"](project, Path("whisper-model"), "Hello\nHello")
            saved = json.loads((project / "cache" / "transcription.json").read_text())
            self.assertEqual(saved["phrases"], refined)
            self.assertEqual(ns["emit_progress"].call_args.args, ("subtitles", 100.0, "Legendas sincronizadas geradas"))


if __name__ == "__main__":
    unittest.main()
