import type { TimelineSubdivision } from "../../config/userPreferences";

export interface TempoGridLine {
  time: number;
  isBar: boolean;
}

export function tempoGridLines(
  duration: number,
  bpm: number,
  offset: number,
  subdivision: TimelineSubdivision
) {
  if (
    !Number.isFinite(duration) ||
    !Number.isFinite(bpm) ||
    duration <= 0 ||
    bpm <= 0
  )
    return [];

  const step = ((60_000 / bpm) * 4) / subdivision;
  const firstIndex = Math.ceil(-offset / step);
  const lastIndex = Math.floor((duration - offset) / step);
  const lines: TempoGridLine[] = [];
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const time = offset + index * step;
    lines.push({ time, isBar: index % subdivision === 0 });
  }
  return lines;
}

export function snapTimeToGrid(
  time: number,
  bpm: number,
  offset: number,
  subdivision: TimelineSubdivision
) {
  const step = ((60_000 / bpm) * 4) / subdivision;
  return Math.round(offset + Math.round((time - offset) / step) * step);
}
