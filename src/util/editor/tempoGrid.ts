import type { TimelineSubdivision } from "../../config/userPreferences";
import type {
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
