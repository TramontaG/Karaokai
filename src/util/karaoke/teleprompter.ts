import type { SubtitleTrack } from "../../domain/project";
import {
  bookViewAt,
  layoutBook,
  BOOK_PAGE_LEAD_MS,
  type BookMeasureText,
} from "./book";

const finite = (value: number | undefined) =>
  Number.isFinite(value) ? value! : 0;
const progress = (time: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (time - start) / Math.max(1, end - start)));
const smooth = (value: number) => value * value * (3 - 2 * value);
const EXIT_MS = 1000;

export function layoutTeleprompter(
  track: SubtitleTrack,
  measure: BookMeasureText
) {
  // Reuse glyph measurement and wrapping, independent of the reading anchor.
  const layout = layoutBook(
    { ...track, style: { ...track.style, x: 0, y: 0 } },
    measure
  );
  const area = {
    ...layout.area,
    x: layout.area.x + finite(track.style.x),
    y: layout.height / 2 + finite(track.style.y),
  };
  const sections = new Map<number, typeof layout.entries>();
  for (const entry of layout.entries) {
    const group = sections.get(entry.sectionIndex) ?? [];
    group.push(entry);
    sections.set(entry.sectionIndex, group);
  }
  const entries = [...sections.values()].flatMap((group) => {
    let top = 0;
    const showAt = group[0].start - BOOK_PAGE_LEAD_MS;
    const hideAt = Math.max(...group.map((entry) => entry.end)) + EXIT_MS;
    return group.map((entry) => {
      const result = { ...entry, top, showAt, hideAt };
      top += entry.height + layout.spacing;
      return result;
    });
  });
  return { ...layout, area, entries };
}

export function teleprompterViewAt(
  layout: ReturnType<typeof layoutBook>,
  time: number
) {
  if (!Number.isFinite(time)) return [];
  const entries = layout.entries.filter(
    (entry) => time >= entry.showAt && time < entry.hideAt
  );
  if (!entries.length) return [];
  const first = entries[0];
  const last = entries.at(-1)!;
  let scroll = 0;
  if (time < first.start) {
    // The whole text enters from below, with no opacity animation.
    scroll =
      -(layout.height - layout.area.y) *
      (1 - smooth(progress(time, first.showAt, first.start)));
  } else {
    let index = 0;
    while (index + 1 < entries.length && entries[index + 1].start <= time)
      index++;
    const current = entries[index];
    const next = entries[index + 1];
    const target = next?.top ?? current.top + current.height + layout.spacing;
    // Monotone cubic interpolation shares a positive velocity at every
    // interior phrase boundary. Unlike per-phrase ease-in/out it never stops
    // there, and cannot overshoot the next reading position.
    const velocity = (at: number) => {
      if (at <= 0 || at >= entries.length) return 0;
      const before = entries[at - 1];
      const here = entries[at];
      const after = entries[at + 1];
      const leftTime = here.start - before.start;
      const rightTime = (after?.start ?? here.end) - here.start;
      if (leftTime <= 0 || rightTime <= 0) return 0;
      const leftSpeed = (here.top - before.top) / leftTime;
      const rightSpeed =
        ((after?.top ?? here.top + here.height + layout.spacing) - here.top) /
        rightTime;
      const w1 = 2 * rightTime + leftTime;
      const w2 = rightTime + 2 * leftTime;
      return (w1 + w2) / (w1 / leftSpeed + w2 / rightSpeed);
    };
    const duration = Math.max(1, (next?.start ?? current.end) - current.start);
    const t = progress(time, current.start, next?.start ?? current.end);
    scroll =
      current.top +
      (target - current.top) * smooth(t) +
      duration *
        (t * (1 - t) ** 2 * velocity(index) +
          t * t * (t - 1) * velocity(index + 1));
    if (!next) {
      const end = last.hideAt - EXIT_MS;
      scroll +=
        Math.max(0, layout.area.y) * smooth(progress(time, end, last.hideAt));
    }
  }
  const shifted = {
    ...layout,
    entries: entries.map((entry) => ({
      ...entry,
      top: layout.area.y + entry.top - scroll,
    })),
  };
  return bookViewAt(shifted, time)
    .map((entry) => ({ ...entry, opacity: 1 }))
    .filter(
      (entry) => entry.top + entry.height >= 0 && entry.top <= layout.height
    );
}
