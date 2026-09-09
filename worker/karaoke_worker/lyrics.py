"""Coarse, monotonic lyric-to-ASR alignment utilities.

Supplied lyrics are immutable source text. ASR is only used to find broad
regions in audio; it must never supply text to final karaoke phrases.
"""

from __future__ import annotations

import re
import math
from difflib import SequenceMatcher


GAP_OPEN = -1.2
GAP_EXTEND = -0.08
MATCH_REWARD = 2.0
SUBSTITUTION_PENALTY = -0.9
MIN_GENERATED_GAP_MS = 250


def lyric_lines(lyrics: str) -> list[str]:
    return [line.strip() for line in lyrics.splitlines() if line.strip()]


def normalize_lyrics(text: str) -> str:
    return " ".join(comparable_words(text))


def comparable_words(text: str) -> list[str]:
    return [
        normalized
        for word in re.findall(r"[^\s]+", text, flags=re.UNICODE)
        if (normalized := re.sub(r"[^\w]+", "", word.casefold(), flags=re.UNICODE).strip("_"))
    ]


def tokenize_lyrics(lyrics: str) -> tuple[list[str], list[dict]]:
    """Return original lines and normalized tokens with their source line."""
    lines = lyric_lines(lyrics)
    tokens = []
    for line_index, line in enumerate(lines):
        for token_index, token in enumerate(comparable_words(line)):
            tokens.append({"token": token, "line_index": line_index, "token_index": token_index})
    return lines, tokens


def tokenize_asr(asr_segments: list[dict]) -> list[dict]:
    """Flatten ASR words, preferring word timestamps over segment timestamps."""
    tokens = []
    for segment in asr_segments:
        start = float(segment.get("start", 0))
        end = float(segment.get("end", start))
        words = segment.get("words") or []
        if words:
            for word in words:
                normalized = comparable_words(str(word.get("word", word.get("text", ""))).strip())
                if normalized:
                    tokens.append({"token": normalized[0], "time": float(word.get("start", start)), "end": float(word.get("end", end)), "timestamp_source": "word"})
            continue
        segment_tokens = comparable_words(str(segment.get("text", "")))
        for index, token in enumerate(segment_tokens):
            tokens.append({"token": token, "time": start + (end - start) * index / len(segment_tokens), "end": start + (end - start) * (index + 1) / len(segment_tokens), "timestamp_source": "segment"})
    return tokens


def approximate_line_word_timings(lines: list[str], start: float, end: float) -> list[list[dict]]:
    """Give every supplied line an editable, explicitly approximate window.

    This runs only after forced alignment could not produce complete word
    timings. Timing is distributed across the complete unresolved region, never
    independently fabricated per line before WhisperX gets a chance to align.
    """
    line_tokens = [line.split() for line in lines]
    tokens = [token for line in line_tokens for token in line]
    if not tokens:
        return [[] for _ in lines]
    safe_start = start if math.isfinite(start) else 0.0
    minimum_duration = max(1.5 * len(lines), 0.35 * len(tokens))
    safe_end = max(end if math.isfinite(end) else safe_start, safe_start + minimum_duration)
    total_weight = sum(max(len(token), 1) for token in tokens)
    cursor = safe_start
    timed_tokens = []
    for index, token in enumerate(tokens):
        boundary = safe_end if index == len(tokens) - 1 else cursor + (safe_end - safe_start) * max(len(token), 1) / total_weight
        timed_tokens.append({"word": token, "start": cursor, "end": boundary})
        cursor = boundary
    timed_lines, offset = [], 0
    for tokens_for_line in line_tokens:
        timed_lines.append(timed_tokens[offset:offset + len(tokens_for_line)])
        offset += len(tokens_for_line)
    return timed_lines


def normalize_generated_word_gaps(words: list[dict]) -> None:
    """Keep only meaningful automatic pauses in newly generated projects.

    User-created gaps are edited later in the UI and are not passed through this
    function. A sub-250 ms ASR/alignment gap is collapsed so it cannot create a
    visually distracting striped sliver between otherwise continuous words.
    """
    normalized: list[dict] = []
    for word in words:
        current = dict(word)
        if normalized:
            previous = normalized[-1]
            gap = current["start"] - previous["end"]
            if gap >= MIN_GENERATED_GAP_MS:
                normalized.append(
                    {
                        "id": f"gap-{previous['id']}-{current['id']}",
                        "type": "gap",
                        "text": "",
                        "start": previous["end"],
                        "end": current["start"],
                    }
                )
            elif gap > 0:
                current["start"] = previous["end"]
            elif gap < 0:
                boundary = round((previous["end"] + current["start"]) / 2)
                previous["end"] = boundary
                current["start"] = boundary
        normalized.append(current)
    words[:] = normalized


def monotonic_timing_blocks(intervals: list[tuple[float, float]]) -> list[tuple[int, int]]:
    """Return inclusive-exclusive runs that violate source-order timing."""
    blocks = []
    index = 0
    while index < len(intervals):
        maximum_end = intervals[index][1]
        end_index = index + 1
        while end_index < len(intervals) and intervals[end_index][0] < maximum_end:
            maximum_end = max(maximum_end, intervals[end_index][1])
            end_index += 1
        if end_index > index + 1:
            blocks.append((index, end_index))
        index = end_index
    return blocks


def token_similarity(official: str, asr: str) -> float:
    return 1.0 if official == asr else SequenceMatcher(None, official, asr, autojunk=False).ratio()


def align_token_sequences(official_tokens: list[dict], asr_tokens: list[dict]) -> list[dict]:
    """Needleman-Wunsch/Gotoh alignment with affine gaps."""
    n, m = len(official_tokens), len(asr_tokens)
    infinity = float("-inf")
    matrices = {state: [[infinity] * (m + 1) for _ in range(n + 1)] for state in "MXY"}
    previous = {state: [[None] * (m + 1) for _ in range(n + 1)] for state in "MXY"}
    matrices["M"][0][0] = 0.0
    for index in range(1, n + 1):
        matrices["X"][index][0] = GAP_OPEN + GAP_EXTEND * (index - 1)
        previous["X"][index][0] = ("X" if index > 1 else "M", index - 1, 0)
    for index in range(1, m + 1):
        matrices["Y"][0][index] = GAP_OPEN + GAP_EXTEND * (index - 1)
        previous["Y"][0][index] = ("Y" if index > 1 else "M", 0, index - 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            similarity = token_similarity(official_tokens[i - 1]["token"], asr_tokens[j - 1]["token"])
            score = MATCH_REWARD * similarity if similarity >= 0.55 else SUBSTITUTION_PENALTY
            state = max("MXY", key=lambda candidate: matrices[candidate][i - 1][j - 1])
            matrices["M"][i][j] = matrices[state][i - 1][j - 1] + score
            previous["M"][i][j] = (state, i - 1, j - 1)
            state = max("MX", key=lambda candidate: matrices[candidate][i - 1][j] + (GAP_EXTEND if candidate == "X" else GAP_OPEN))
            matrices["X"][i][j] = matrices[state][i - 1][j] + (GAP_EXTEND if state == "X" else GAP_OPEN)
            previous["X"][i][j] = (state, i - 1, j)
            state = max("MY", key=lambda candidate: matrices[candidate][i][j - 1] + (GAP_EXTEND if candidate == "Y" else GAP_OPEN))
            matrices["Y"][i][j] = matrices[state][i][j - 1] + (GAP_EXTEND if state == "Y" else GAP_OPEN)
            previous["Y"][i][j] = (state, i, j - 1)
    state = max("MXY", key=lambda candidate: matrices[candidate][n][m])
    i, j = n, m
    alignment = []
    while i or j:
        before = previous[state][i][j]
        if before is None:
            break
        prior_state, prior_i, prior_j = before
        lyric_index = i - 1 if i > prior_i else None
        asr_index = j - 1 if j > prior_j else None
        similarity = token_similarity(official_tokens[lyric_index]["token"], asr_tokens[asr_index]["token"]) if lyric_index is not None and asr_index is not None else 0.0
        alignment.append({"lyric_token_index": lyric_index, "asr_token_index": asr_index, "operation": "match" if lyric_index is not None and asr_index is not None else "gap", "similarity": similarity})
        state, i, j = prior_state, prior_i, prior_j
    return list(reversed(alignment))


def extract_temporal_anchors(alignment: list[dict], asr_tokens: list[dict]) -> list[dict]:
    """Only exact token matches are reliable temporal anchors."""
    return [{"lyric_token_index": entry["lyric_token_index"], "time": asr_tokens[entry["asr_token_index"]]["time"], "end": asr_tokens[entry["asr_token_index"]]["end"], "confidence": entry["similarity"]} for entry in alignment if entry["operation"] == "match" and entry["similarity"] == 1.0]


def build_alignment_regions(lines: list[str], lyric_tokens: list[dict], anchors: list[dict], asr_tokens: list[dict]) -> list[dict]:
    """Build broad line-preserving regions; never distribute time per line."""
    if not lines or not asr_tokens:
        return []
    anchors_by_token = {anchor["lyric_token_index"]: anchor for anchor in anchors}
    line_tokens = [[index for index, token in enumerate(lyric_tokens) if token["line_index"] == line_index] for line_index in range(len(lines))]
    reliable = {line_index for line_index, indices in enumerate(line_tokens) if indices and all(index in anchors_by_token for index in indices)}
    regions, line_start = [], 0
    for line_end in range(len(lines)):
        if line_end not in reliable and line_end != len(lines) - 1:
            continue
        included = [index for indices in line_tokens[line_start:line_end + 1] for index in indices]
        region_anchors = [anchors_by_token[index] for index in included if index in anchors_by_token]
        before = [anchors_by_token[index] for indices in line_tokens[:line_start] for index in indices if index in anchors_by_token]
        after = [anchors_by_token[index] for indices in line_tokens[line_end + 1:] for index in indices if index in anchors_by_token]
        start = before[-1]["end"] if before else (region_anchors[0]["time"] if region_anchors else asr_tokens[0]["time"])
        end = after[0]["time"] if after else (region_anchors[-1]["end"] if region_anchors else asr_tokens[-1]["end"])
        regions.append({"start": start, "end": max(start, end), "line_start": line_start, "line_end": line_end + 1, "lines": lines[line_start:line_end + 1], "text": " ".join(lines[line_start:line_end + 1])})
        line_start = line_end + 1
    # Adjacent regions are ordered by source lyrics, not by independent ASR
    # matches. Do not let repeated words make a later region search backwards
    # into the previous lyric block.
    for index in range(1, len(regions)):
        previous, current = regions[index - 1], regions[index]
        if current["start"] < previous["end"]:
            boundary = (current["start"] + previous["end"]) / 2
            previous["end"] = boundary
            current["start"] = boundary
    return regions


def localize_lyrics(lyrics: str, asr_segments: list[dict]) -> dict:
    """Create a coarse plan; no final per-line timestamps are invented here."""
    lines, official_tokens = tokenize_lyrics(lyrics)
    asr_tokens = tokenize_asr(asr_segments)
    if not lines:
        raise RuntimeError("The supplied lyrics do not contain any words")
    alignment = align_token_sequences(official_tokens, asr_tokens) if asr_tokens else []
    anchors = extract_temporal_anchors(alignment, asr_tokens)
    return {"lines": lines, "tokens": official_tokens, "alignment": alignment, "anchors": anchors, "regions": build_alignment_regions(lines, official_tokens, anchors, asr_tokens), "asr_tokens": asr_tokens}