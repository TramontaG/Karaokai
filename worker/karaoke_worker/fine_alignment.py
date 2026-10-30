"""Convert a single phrase's WhisperX timings back to the project timeline."""

import math

from karaoke_worker.lyrics import normalize_generated_word_gaps


def phrase_window(start_ms: int, end_ms: int, audio_duration: float) -> tuple[float, float]:
    if start_ms < 0 or end_ms <= start_ms or audio_duration <= 0:
        raise ValueError("Invalid phrase timing")
    start = max(0.0, start_ms / 1000 - 1.0)
    end = min(audio_duration, end_ms / 1000 + 1.0)
    if end <= start:
        raise ValueError("The phrase is outside the vocal audio")
    return start, end


def complete_word_timings(tokens: list[str], aligned_words: list[dict], duration: float, bounds: tuple[float, float]) -> list[dict]:
    """Fill missing boundaries between acoustic anchors, preserving known times."""
    timings = []
    positions = []
    cursor = 0
    for token, word in zip(tokens, aligned_words):
        positions.extend((cursor, cursor + len(token)))
        cursor += len(token)
        for side in ("start", "end"):
            value = word.get(side)
            if value is not None:
                if not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError("WhisperX returned invalid word timings")
                value = min(duration, max(0.0, value))
            timings.append(value)
    if all(value is not None for value in timings):
        return aligned_words
    if not any(
        timings[index] is not None and timings[index + 1] is not None
        and timings[index + 1] > timings[index]
        for index in range(0, len(timings), 2)
    ):
        raise ValueError("WhisperX could not find reliable word timings in this phrase")

    known = [index for index, value in enumerate(timings) if value is not None]
    left_edge = max(0.0, bounds[0])
    right_edge = min(duration, bounds[1])
    if left_edge >= timings[known[0]]:
        left_edge = 0.0
    if right_edge <= timings[known[-1]]:
        right_edge = duration
    anchors = [(-1, 0, left_edge)] + [
        (index, positions[index], timings[index]) for index in known
    ] + [(len(timings), cursor, right_edge)]
    for (left, left_position, start), (right, right_position, end) in zip(anchors, anchors[1:]):
        if right == left + 1:
            continue
        if end < start or right_position <= left_position:
            raise ValueError("No room to recover missing word timings")
        for index in range(left + 1, right):
            fraction = (positions[index] - left_position) / (right_position - left_position)
            timings[index] = start + fraction * (end - start)
    return [
        {"start": timings[2 * index], "end": timings[2 * index + 1]}
        for index in range(len(tokens))
    ]


def fine_alignment_result(text: str, aligned_words: list[dict], offset: float, duration: float, bounds: tuple[float, float] | None = None) -> dict:
    tokens = text.split()
    if not tokens or len(aligned_words) != len(tokens):
        raise ValueError("WhisperX could not align every word in the phrase")
    aligned_words = complete_word_timings(tokens, aligned_words, duration, bounds or (0.0, duration))
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


def refine_provided_phrases(phrases: list[dict], align_phrase, progress) -> list[dict]:
    """Refine each original window without losing text, IDs, or phrase order."""
    refined = []
    for index, phrase in enumerate(phrases):
        try:
            result = align_phrase(phrase)
            lower = refined[-1]["end"] if refined else 0
            upper = phrases[index + 1]["start"] if index + 1 < len(phrases) else math.inf
            if result["start"] < lower or result["end"] > upper:
                raise ValueError("Fine alignment crossed a neighboring phrase")
            old_words = [word for word in phrase["words"] if word.get("type") != "gap"]
            words = [
                {**old, **word}
                for old, word in zip(old_words, result["words"])
            ]
            if len(words) != len(phrase["text"].split()) or len(result["words"]) != len(words):
                raise ValueError("Fine alignment changed the word count")
            normalize_generated_word_gaps(words)
            refined.append({
                **phrase, "start": result["start"], "end": result["end"],
                "words": words, "alignment_status": "aligned", "confidence": 1.0,
            })
        except ValueError:
            refined.append(phrase)
        progress(index + 1, len(phrases))
    return refined
