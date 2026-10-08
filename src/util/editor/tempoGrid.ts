import type { TimelineSubdivision } from "../../config/userPreferences";
import type {
  KaraokeProject,
  SubtitlePhrase,
  SubtitleWord,
  TimeSignature,
  TimeSignatureMarker,
  TempoChangeMarker,
} from "../../domain/project";

export interface TempoGridLine {
  time: number;
  isBar: boolean;
}

export function validTimeSignature(signature: TimeSignature) {
  return (
    Number.isInteger(signature.numerator) &&
    signature.numerator >= 1 &&
    signature.numerator <= 32 &&
    [2, 4, 8, 16, 32].includes(signature.denominator)
  );
}

export function sortedTimeSignatures(markers: TimeSignatureMarker[] = []) {
  const byTime = new Map<number, TimeSignatureMarker>();
  for (const marker of markers) {
    if (
      Number.isFinite(marker.time) &&
      marker.time >= 0 &&
      validTimeSignature(marker)
    )
      byTime.set(marker.time, marker);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function sortedTempoChanges(markers: TempoChangeMarker[] = []) {
  const byTime = new Map<number, TempoChangeMarker>();
  for (const marker of markers) {
    if (
      Number.isFinite(marker.time) &&
      marker.time >= 0 &&
      Number.isFinite(marker.bpm) &&
      marker.bpm >= 20 &&
      marker.bpm <= 400
    )
      byTime.set(marker.time, marker);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function tempoGridLines(
  duration: number,
  bpm: number,
  offset: number,
  subdivision: TimelineSubdivision,
  changes: TimeSignatureMarker[] = [],
  tempoChanges: TempoChangeMarker[] = []
) {
  if (
    !Number.isFinite(duration) ||
    !Number.isFinite(bpm) ||
    !Number.isFinite(offset) ||
    duration <= 0 ||
    bpm <= 0 ||
    ![4, 8, 16, 32].includes(subdivision)
  )
    return [];

  const events = new Map<number, { signature?: TimeSignature; bpm?: number }>();
  for (const marker of sortedTimeSignatures(changes)) {
    if (marker.time <= duration) events.set(marker.time, { signature: marker });
  }
  for (const marker of sortedTempoChanges(tempoChanges)) {
    if (marker.time <= duration)
      events.set(marker.time, { ...events.get(marker.time), bpm: marker.bpm });
  }
  // Musical phase is measured in quarter notes. Tempo changes preserve phase;
  // signature changes start a bar. Neither changes the audio playback rate.
  const segments = [
    {
      time: 0,
      phase: (-offset * bpm) / 60_000,
      bpm,
      numerator: 4,
      denominator: 4,
    },
  ];
  for (const [time, event] of [...events].sort(([a], [b]) => a - b)) {
    const previous = segments[segments.length - 1];
    segments.push({
      time,
      phase: event.signature
        ? 0
        : previous.phase + ((time - previous.time) * previous.bpm) / 60_000,
      bpm: event.bpm ?? previous.bpm,
      numerator: event.signature?.numerator ?? previous.numerator,
      denominator: event.signature?.denominator ?? previous.denominator,
    });
  }
  const lines: TempoGridLine[] = [];
  const step = 4 / subdivision;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const end = segments[index + 1]?.time ?? duration;
    const exclusiveEnd = index < segments.length - 1;
    const barLength = (4 * segment.numerator) / segment.denominator;
    const endPhase =
      segment.phase + ((end - segment.time) * segment.bpm) / 60_000;
    const firstBar = Math.floor(segment.phase / barLength);
    const lastBar = Math.floor((endPhase + 1e-10) / barLength);
    for (let bar = firstBar; bar <= lastBar; bar++) {
      for (let beat = 0; beat * step < barLength - 1e-10; beat++) {
        const time =
          segment.time +
          ((bar * barLength + beat * step - segment.phase) * 60_000) /
            segment.bpm;
        if (
          time < segment.time - 1e-7 ||
          time > end + 1e-7 ||
          (exclusiveEnd && time >= end - 1e-7)
        )
          continue;
        lines.push({
          time: Math.max(segment.time, Math.min(end, time)),
          isBar: beat === 0,
        });
      }
    }
  }
  return lines;
}

export function nearestGridTime(lines: TempoGridLine[], time: number) {
  if (!lines.length) return time;
  let low = 0;
  let high = lines.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (lines[middle].time < time) low = middle + 1;
    else high = middle;
  }
  const before = lines[Math.max(0, low - 1)].time;
  const after = lines[Math.min(low, lines.length - 1)].time;
  return time - before < after - time ? before : after;
}

function nearestGridIndex(
  grid: number[],
  time: number,
  minimum: number,
  maximum: number
) {
  let low = minimum;
  let high = maximum + 1;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (grid[middle] < time) low = middle + 1;
    else high = middle;
  }
  const before = Math.max(minimum, low - 1);
  const after = Math.min(maximum, low);
  return time - grid[before] < grid[after] - time ? before : after;
}

/** Snap phrase and word boundaries to the visible grid without losing words. */
export function alignSubtitlePhrasesToGrid(
  project: KaraokeProject,
  lines: TempoGridLine[]
) {
  if (lines.length < 2) return { project, alignedCount: 0 };
  const grid = [...new Set(lines.map((line) => Math.round(line.time)))].sort(
    (left, right) => left - right
  );
  if (grid.length < 2) return { project, alignedCount: 0 };
  let alignedCount = 0;
  const tracks = project.tracks.map((track) => {
    if (track.type !== "subtitle" || track.locked) return track;
    const phrases = track.phrases.map((phrase, index): SubtitlePhrase => {
      if (
        !Number.isFinite(phrase.start) ||
        !Number.isFinite(phrase.end) ||
        phrase.end <= phrase.start
      )
        return phrase;
      const startIndex = nearestGridIndex(
        grid,
        phrase.start,
        0,
        grid.length - 1
      );
      const endIndex = nearestGridIndex(grid, phrase.end, 0, grid.length - 1);
      const nextEndIndex = endIndex > startIndex ? endIndex : startIndex + 1;
      if (nextEndIndex >= grid.length) return phrase;
      const start = grid[startIndex];
      const nextEnd = grid[nextEndIndex];
      const previousPhrase = track.phrases[index - 1];
      const nextPhrase = track.phrases[index + 1];
      if (
        (previousPhrase &&
          previousPhrase.end <= phrase.start &&
          start < previousPhrase.end) ||
        (nextPhrase &&
          phrase.end <= nextPhrase.start &&
          nextEnd > nextPhrase.start)
      )
        return phrase;
      const sourceWordIndices = phrase.words.flatMap((word, wordIndex) =>
        word.type === "gap" ? [] : [wordIndex]
      );
      const sourceWords = sourceWordIndices.map(
        (wordIndex) => phrase.words[wordIndex]
      );
      if (
        sourceWords.some(
          (word) =>
            !Number.isFinite(word.start) ||
            !Number.isFinite(word.end) ||
            word.start < phrase.start ||
            word.end > phrase.end ||
            word.end <= word.start
        )
      )
        return phrase;
      if (nextEndIndex - startIndex < sourceWordIndices.length) return phrase;
      const ratio = (nextEnd - start) / (phrase.end - phrase.start);
      const target = (time: number) => start + (time - phrase.start) * ratio;
      const words: SubtitleWord[] = [];
      const alignedWords: SubtitleWord[] = [];
      let previousEndIndex = startIndex;
      for (let index = 0; index < sourceWordIndices.length; index += 1) {
        const source = sourceWords[index];
        const remaining = sourceWordIndices.length - index - 1;
        const wordStartIndex =
          index === 0
            ? startIndex
            : nearestGridIndex(
                grid,
                target(source.start),
                previousEndIndex,
                nextEndIndex - remaining - 1
              );
        const wordEndIndex =
          remaining === 0
            ? nextEndIndex
            : nearestGridIndex(
                grid,
                target(source.end),
                wordStartIndex + 1,
                nextEndIndex - remaining
              );
        const word = {
          ...source,
          start: grid[wordStartIndex],
          end: grid[wordEndIndex],
        };
        const previous = words.at(-1);
        if (previous && previous.end < word.start) {
          const previousSourceIndex = sourceWordIndices[index - 1];
          const existingGap = phrase.words
            .slice(previousSourceIndex + 1, sourceWordIndices[index])
            .find((entry) => entry.type === "gap");
          if (existingGap)
            words.push({
              ...existingGap,
              start: previous.end,
              end: word.start,
            });
        }
        words.push(word);
        alignedWords.push(word);
        previousEndIndex = wordEndIndex;
      }
      if (
        words.some(
          (word) =>
            !Number.isFinite(word.start) ||
            !Number.isFinite(word.end) ||
            word.end <= word.start ||
            word.start < start ||
            word.end > nextEnd
        )
      )
        return phrase;
      if (
        start === phrase.start &&
        nextEnd === phrase.end &&
        sourceWords.every((source, index) => {
          const aligned = alignedWords[index];
          return source.start === aligned.start && source.end === aligned.end;
        })
      )
        return phrase;
      alignedCount += 1;
      return { ...phrase, start, end: nextEnd, words };
    });
    return { ...track, phrases };
  });
  return alignedCount
    ? {
        project: { ...project, updatedAt: String(Date.now()), tracks },
        alignedCount,
      }
    : { project, alignedCount };
}

export function snapTimeToGrid(
  time: number,
  bpm: number,
  offset: number,
  subdivision: TimelineSubdivision,
  changes: TimeSignatureMarker[] = [],
  tempoChanges: TempoChangeMarker[] = []
) {
  return nearestGridTime(
    tempoGridLines(
      Math.max(time, offset, 0) + (240_000 / bpm) * 32,
      bpm,
      offset,
      subdivision,
      changes,
      tempoChanges
    ),
    time
  );
}
