import {
  resolveSubtitleStyle,
  resolveTimingCurve,
  subtitleFontStack,
  wordReadProgress,
  type SubtitlePhrase,
  type SubtitleTrack,
  type SubtitleWord,
} from "../../domain/project";

export const BOOK_LOOKAHEAD_MS = 10_000;
export const BOOK_CUE_MS = 2_000;
export const BOOK_PAGE_LEAD_MS = 3_000;
export const BOOK_FADE_MS = 350;
export const BOOK_CUE_GAP_MS = 4_000;
export type BookTextMetrics = {
  width: number;
  ascent?: number;
  descent?: number;
  bearing?: number;
};
export type BookMeasureText = (text: string, font: string) => BookTextMetrics;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const positive = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
const offset = (value: number | undefined) =>
  Number.isFinite(value) ? value! : 0;
const fontFor = (
  style: ReturnType<typeof resolveSubtitleStyle>,
  size: number
) =>
  `${style.fontStyle} ${style.fontWeight} ${size}px ${subtitleFontStack(style.fontFamily)}`;

function phraseLayout(
  track: SubtitleTrack,
  phrase: SubtitlePhrase,
  phraseIndex: number,
  areaWidth: number,
  areaHeight: number,
  baseSize: number,
  measure: BookMeasureText
) {
  const valid = phrase.words.filter(
    (word) =>
      Number.isFinite(word.start) &&
      Number.isFinite(word.end) &&
      word.end > word.start
  );
  const timed = valid.length
    ? valid
    : Number.isFinite(phrase.start) &&
        phrase.end > phrase.start &&
        phrase.text.trim()
      ? [
          {
            id: `${phrase.id}-text`,
            text: phrase.text,
            start: phrase.start,
            end: phrase.end,
          } satisfies SubtitleWord,
        ]
      : [];
  const start = Math.min(...timed.map((word) => word.start));
  const end = Math.max(...timed.map((word) => word.end));
  const insetX = clamp(offset(phrase.style?.x), 0, areaWidth * 0.8);
  const availableWidth = areaWidth - insetX;
  const tokens = timed
    .filter((word) => word.type !== "gap" && word.text.trim())
    .map((word, index) => {
      const style = resolveSubtitleStyle(track.style, phrase.style, word.style);
      let fontSize =
        baseSize *
        positive(style.scale, 1) *
        (style.verticalAlign === "baseline" ? 1 : 0.75);
      let font = fontFor(style, fontSize);
      let metrics = measure(word.text, font);
      const fit = Math.min(1, availableWidth / Math.max(1, metrics.width));
      if (fit < 1) {
        fontSize *= fit;
        font = fontFor(style, fontSize);
        // Scale the measured glyph bounds exactly, independent of font hinting.
        metrics = {
          width: metrics.width * fit,
          ascent: (metrics.ascent ?? baseSize * style.scale) * fit,
          descent: (metrics.descent ?? baseSize * style.scale * 0.3) * fit,
          bearing: (metrics.bearing ?? 0) * fit,
        };
      }
      return {
        id: `${phraseIndex}:${index}`,
        word,
        style,
        font,
        fontSize,
        width: Math.min(availableWidth, Math.max(0, metrics.width)),
        ascent: Math.max(fontSize * 0.8, metrics.ascent ?? fontSize),
        descent: Math.max(fontSize * 0.3, metrics.descent ?? 0),
        bearing: metrics.bearing ?? 0,
        curve: resolveTimingCurve(track.curve, phrase.curve, word.curve),
        dx: clamp(
          offset(word.style?.x),
          0,
          availableWidth - Math.min(availableWidth, Math.max(0, metrics.width))
        ),
        dy:
          offset(word.style?.y) +
          (style.verticalAlign === "super"
            ? -fontSize * 0.4
            : style.verticalAlign === "sub"
              ? fontSize * 0.3
              : 0),
        x: 0,
        y: 0,
      };
    });
  if (!tokens.length) return null;
  const lines: (typeof tokens)[] = [];
  let line: typeof tokens = [];
  let cursor = 0;
  for (const token of tokens) {
    const space = line.length ? token.fontSize * 0.25 : 0;
    if (
      line.length &&
      cursor + space + token.dx + token.width > availableWidth
    ) {
      lines.push(line);
      line = [];
      cursor = 0;
    }
    token.x = insetX + cursor + (line.length ? space : 0) + token.dx;
    cursor = token.x - insetX + token.width;
    line.push(token);
  }
  if (line.length) lines.push(line);
  let y = Math.max(0, offset(phrase.style?.y));
  for (const row of lines) {
    const ascent = Math.max(0, ...row.map((token) => token.ascent - token.dy));
    const descent = Math.max(
      0,
      ...row.map((token) => token.descent + token.dy)
    );
    for (const token of row) token.y = y + ascent + token.dy;
    y += ascent + descent + baseSize * 0.35;
  }
  const height = Math.max(1, y - baseSize * 0.35);
  const shrink = Math.min(1, areaHeight / height);
  for (const token of tokens) {
    token.x *= shrink;
    token.y *= shrink;
    token.width *= shrink;
    token.ascent *= shrink;
    token.descent *= shrink;
    token.bearing *= shrink;
    token.fontSize *= shrink;
    token.font = fontFor(token.style, token.fontSize);
  }
  return {
    id: `${phraseIndex}:${phrase.id}`,
    phrase,
    start,
    end,
    height: height * shrink,
    words: tokens,
  };
}

// Layout and assignment depend only on project data, never playback history.
export function layoutBook(track: SubtitleTrack, measure: BookMeasureText) {
  const width = positive(track.style.positionReferenceWidth, 640);
  const height = positive(track.style.positionReferenceHeight, 360);
  const marginX = width * 0.06;
  const marginY = height * 0.06;
  const x = clamp(marginX + offset(track.style.x), marginX, width * 0.75);
  const y = clamp(marginY + offset(track.style.y), marginY, height * 0.75);
  const area = {
    x,
    y,
    width: width - marginX - x,
    height: height - marginY - y,
  };
  const baseSize = width * 0.03;
  const phrases = track.phrases
    .map((phrase, index) =>
      phraseLayout(
        track,
        phrase,
        index,
        area.width,
        area.height,
        baseSize,
        measure
      )
    )
    .filter((phrase): phrase is NonNullable<typeof phrase> => phrase !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const sections: { phrases: typeof phrases; end: number }[] = [];
  for (const phrase of phrases) {
    let section = sections.at(-1);
    if (!section || phrase.start - section.end > BOOK_LOOKAHEAD_MS) {
      section = { phrases: [], end: phrase.end };
      sections.push(section);
    }
    section.phrases.push(phrase);
    section.end = Math.max(section.end, phrase.end);
  }
  const spacing = baseSize * 0.35;
  let previousSungEnd = -Infinity;
  const entries = sections.flatMap((section, sectionIndex) => {
    type Entry = (typeof phrases)[number] & {
      slot: number;
      top: number;
      sectionIndex: number;
      showAt: number;
      hideAt: number;
      cueAllowed: boolean;
    };
    const scheduled: Entry[] = [];
    const slots = new Map<number, number>();
    let cursor = 0;
    const pageShowAt =
      section.phrases[0].words[0].word.start - BOOK_PAGE_LEAD_MS;
    for (const phrase of section.phrases) {
      // Pack by actual height once, then wrap at the bottom of the page.
      // A phrase never changes coordinates during its visible lifetime.
      if (cursor + phrase.height > area.height + 1e-7) cursor = 0;
      const top = area.y + cursor;
      if (!slots.has(top)) slots.set(top, slots.size);
      const blockers = scheduled.filter(
        (entry) =>
          entry.top < top + phrase.height + spacing - 1e-7 &&
          top < entry.top + entry.height + spacing - 1e-7
      );
      // Wait for the whole footprint, not just the first row, to become free.
      // At the exact reading start the incoming phrase takes priority, even
      // for overlapping source times. Only intersecting phrases disappear.
      const showAt = Math.min(
        phrase.start,
        Math.max(
          blockers.length
            ? Math.max(pageShowAt, phrase.start - BOOK_LOOKAHEAD_MS)
            : pageShowAt,
          ...blockers.map((entry) => entry.hideAt)
        )
      );
      for (const blocker of blockers) {
        blocker.hideAt = Math.min(blocker.hideAt, showAt);
      }
      const firstSungStart = phrase.words[0].word.start;
      const cueAllowed = firstSungStart - previousSungEnd >= BOOK_CUE_GAP_MS;
      previousSungEnd = Math.max(
        previousSungEnd,
        ...phrase.words.map((word) => word.word.end)
      );
      scheduled.push({
        ...phrase,
        slot: slots.get(top)!,
        top,
        sectionIndex,
        showAt,
        hideAt: phrase.end + BOOK_FADE_MS,
        cueAllowed,
      });
      cursor += phrase.height + spacing;
    }
    return scheduled;
  });
  return { width, height, area, spacing, entries };
}

export function bookViewAt(
  layout: ReturnType<typeof layoutBook>,
  currentTime: number
) {
  if (!Number.isFinite(currentTime)) return [];
  return layout.entries
    .filter(
      (entry) => currentTime >= entry.showAt && currentTime < entry.hideAt
    )
    .sort((a, b) => a.top - b.top)
    .map((entry) => {
      const rowTop = entry.top;
      const firstWord = entry.words[0];
      const cueStart = Math.max(
        entry.showAt,
        firstWord.word.start - BOOK_CUE_MS
      );
      const cueProgress =
        entry.cueAllowed &&
        currentTime >= cueStart &&
        currentTime < firstWord.word.end
          ? clamp(
              (currentTime - cueStart) /
                Math.max(1, firstWord.word.start - cueStart),
              0,
              1
            )
          : null;
      const fadeInDuration = Math.min(
        BOOK_FADE_MS,
        Math.max(0, entry.start - entry.showAt)
      );
      const fadeOutStart = Math.max(
        entry.showAt,
        Math.min(entry.end, entry.hideAt - BOOK_FADE_MS)
      );
      const opacity = Math.min(
        fadeInDuration
          ? clamp((currentTime - entry.showAt) / fadeInDuration, 0, 1)
          : 1,
        clamp(
          (entry.hideAt - currentTime) /
            Math.max(1, entry.hideAt - fadeOutStart),
          0,
          1
        )
      );
      return {
        ...entry,
        opacity,
        top: rowTop,
        active: currentTime >= entry.start && currentTime < entry.end,
        cue:
          cueProgress === null
            ? null
            : {
                progress: cueProgress,
                x: layout.area.x + firstWord.x,
                y: rowTop - layout.spacing * 0.85,
                width: Math.min(
                  layout.width * 0.12,
                  layout.area.width - firstWord.x
                ),
                height: Math.min(layout.width * 0.005, layout.spacing * 0.5),
                unreadColor: firstWord.style.unreadColor,
                readColor: firstWord.style.readColor,
              },
        words: entry.words.map((word) => ({
          ...word,
          x: layout.area.x + word.x,
          y: rowTop + word.y,
          progress: wordReadProgress(word.word, currentTime, word.curve),
        })),
      };
    });
}
