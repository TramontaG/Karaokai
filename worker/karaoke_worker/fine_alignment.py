"""Convert a single phrase's WhisperX timings back to the project timeline."""

import math


def phrase_window(start_ms: int, end_ms: int, audio_duration: float) -> tuple[float, float]:
    if start_ms < 0 or end_ms <= start_ms or audio_duration <= 0:
        raise ValueError("Invalid phrase timing")
    start = max(0.0, start_ms / 1000 - 1.0)
    end = min(audio_duration, end_ms / 1000 + 1.0)
    if end <= start:
        raise ValueError("The phrase is outside the vocal audio")
    return start, end


def fine_alignment_result(text: str, aligned_words: list[dict], offset: float, duration: float) -> dict:
    tokens = text.split()
    if not tokens or len(aligned_words) != len(tokens):
        raise ValueError("WhisperX could not align every word in the phrase")
    words = []
    for token, aligned in zip(tokens, aligned_words):
        relative_start = aligned.get("start")
        relative_end = aligned.get("end")
        if not isinstance(relative_start, (int, float)) or not isinstance(relative_end, (int, float)):
            raise ValueError("WhisperX returned incomplete word timings")
        if not math.isfinite(relative_start) or not math.isfinite(relative_end):
            raise ValueError("WhisperX returned invalid word timings")
        start = round((offset + max(0.0, relative_start)) * 1000)
        end = round((offset + min(duration, relative_end)) * 1000)
        if end <= start or (words and start < words[-1]["start"]):
            raise ValueError("WhisperX returned invalid word order")
        words.append({"text": token, "start": start, "end": end})
    return {"start": words[0]["start"], "end": words[-1]["end"], "words": words}
