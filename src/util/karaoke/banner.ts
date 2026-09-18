import {
  resolveBannerStyle,
  subtitleFontStack,
  type SubtitleTrack,
} from "../../domain/project";

const MAXIMUM_JOIN_GAP_MS = 2000;
const PLAYHEAD_FADE_MS = 1000;

export type MeasureText = (text: string, font: string) => number;

// Coordinates use the saved preview dimensions, never timeline pixels.
// Layout is independent of playback time so seeking cannot rearrange labels.
export function layoutBanner(track: SubtitleTrack, measure: MeasureText) {
  const width = track.style.positionReferenceWidth ?? 640;
  const height = track.style.positionReferenceHeight ?? 360;
  const speed = Math.max(1, track.style.bannerSpeed ?? 300);
  const segments = track.phrases
    .flatMap((phrase, phraseIndex) =>
      phrase.words
        .filter(
          (word) =>
            Number.isFinite(word.start) &&
            Number.isFinite(word.end) &&
            word.end >= word.start
        )
        .map((word) => {
          const style = resolveBannerStyle(
            track.style,
            phrase.style,
            word.style
          );
          const fontSize =
            width *
            (style.bannerFontSize / 640) *
            style.scale *
            (style.verticalAlign === "baseline" ? 1 : 0.75);
          const font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${subtitleFontStack(style.fontFamily)}`;
          const anchor = width / 2 + style.x;
          const left = anchor + (word.start / 1000) * speed;
          const right = anchor + (word.end / 1000) * speed;
          const center = (left + right) / 2;
          const isGap = word.type === "gap";
          const glyphWidth = isGap ? 0 : measure(word.text, font);
          const textWidth = isGap ? 0 : glyphWidth + 8;
          const leftPadding = Math.max(width / 64, fontSize * 0.6);
          const isLong =
            textWidth > right - left ||
            right - left > Math.max(0, width - anchor);
          const labelX =
            !isGap && isLong && style.bannerLongWordAlignment === "left"
              ? left + leftPadding + glyphWidth / 2
              : center;
          return {
            id: `${phrase.id}:${word.id}`,
            word,
            isGap,
            phraseIndex,
            groupIndex: -1,
            synthetic: false,
            style,
            fontSize,
            font,
            anchor,
            left,
            right,
            center,
            y: height / 2 + style.y,
            boxHeight: width * 0.048 * style.scale,
            textWidth,
            labelX,
            lifted: false,
            labelY: undefined as number | undefined,
          };
        })
    )
    .sort((a, b) => a.center - b.center);

  type Segment = (typeof segments)[number];
  // Project normalization also derives phrase bounds from valid words. Use the
  // same source of truth without normalizing or modifying the project here.
  const blocks = track.phrases
    .flatMap((phrase, phraseIndex) => {
      const items = segments
        .filter((segment) => segment.phraseIndex === phraseIndex)
        .sort((a, b) => a.word.start - b.word.start || a.word.end - b.word.end);
      if (!items.length) return [];
      return [
        {
          id: phrase.id,
          items,
          start: Math.min(...items.map((item) => item.word.start)),
          end: Math.max(...items.map((item) => item.word.end)),
        },
      ];
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const runs: { id: string; groupIndex: number; items: Segment[] }[] = [];
  let previous: (typeof blocks)[number] | undefined;
  for (const block of blocks) {
    const gap = previous ? block.start - previous.end : Infinity;
    let run = runs[runs.length - 1];
    if (!previous || gap < 0 || gap > MAXIMUM_JOIN_GAP_MS) {
      run = {
        id: `banner-group:${block.id}`,
        groupIndex: runs.length,
        items: [],
      };
      runs.push(run);
    } else if (gap > 0) {
      // A render-only pause inherits the outgoing edge's appearance, including
      // word overrides. Incoming phrase/word styles stay on their own segments.
      const edge = previous.items.reduce((last, item) =>
        item.word.end > last.word.end ? item : last
      );
      const start = previous.end;
      const end = block.start;
      const left = edge.anchor + (start / 1000) * speed;
      const right = edge.anchor + (end / 1000) * speed;
      const id = `banner-gap:${previous.id}:${block.id}`;
      const silence: Segment = {
        ...edge,
        id,
        groupIndex: run.groupIndex,
        synthetic: true,
        isGap: true,
        word: { id, type: "gap", text: "", start, end },
        left,
        right,
        center: (left + right) / 2,
        labelX: (left + right) / 2,
        textWidth: 0,
        lifted: false,
        labelY: undefined,
      };
      segments.push(silence);
      run.items.push(silence);
    }
    for (const item of block.items) item.groupIndex = run.groupIndex;
    run.items.push(...block.items);
    previous = block;
  }
  segments.sort((a, b) => a.center - b.center);
  const words = segments.filter((segment) => !segment.isGap);

  // One rounded outline and shadow per visual run, including generated pauses.
  // Internal phrase boundaries keep the same square dividers as word boundaries.
  const groups = runs.map(({ id, groupIndex, items }) => {
    const left = Math.min(...items.map((item) => item.left));
    const right = Math.max(...items.map((item) => item.right));
    const top = Math.min(...items.map((item) => item.y - item.boxHeight / 2));
    const bottom = Math.max(
      ...items.map((item) => item.y + item.boxHeight / 2)
    );
    return {
      id,
      groupIndex,
      left,
      right,
      top,
      bottom,
      radius: Math.min(width / 160, (right - left) / 2, (bottom - top) / 2),
    };
  });

  resolveBannerLabelCollisions(words);
  return {
    width,
    height,
    speed,
    groups,
    segments,
    words: words as ((typeof words)[number] & { labelY?: number })[],
  };
}

export function bannerWordState(start: number, end: number, time: number) {
  return time < start ? "unread" : time < end ? "current" : "read";
}

// Song-time fades keep seeking, playback and exported frames deterministic.
export function bannerPlayheadOpacity(
  start: number,
  end: number,
  time: number
) {
  if (![start, end, time].every(Number.isFinite) || end <= start) return 0;
  const progress =
    time < start
      ? (time - start + PLAYHEAD_FADE_MS) / PLAYHEAD_FADE_MS
      : time > end
        ? (end + PLAYHEAD_FADE_MS - time) / PLAYHEAD_FADE_MS
        : 1;
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

export function bannerPlayheadsAt(
  layout: ReturnType<typeof layoutBanner>,
  currentTime: number
) {
  const markers = new Map<
    string,
    {
      x: number;
      y: number;
      height: number;
      color: string;
      priority: number;
      opacity: number;
    }
  >();
  // Include offscreen segments so a fast-moving upcoming phrase can fade its
  // marker in before entering the viewport. Joined pauses keep it visible.
  for (const item of layout.segments) {
    const opacity = bannerPlayheadOpacity(
      item.word.start,
      item.word.end,
      currentTime
    );
    if (opacity === 0) continue;
    const key = `${item.anchor}:${item.y}`;
    const priority =
      currentTime >= item.word.start && currentTime < item.word.end
        ? 1
        : -Math.min(
            Math.abs(currentTime - item.word.start),
            Math.abs(currentTime - item.word.end)
          );
    const previous = markers.get(key);
    if (!previous || priority > previous.priority) {
      markers.set(key, {
        x: item.anchor,
        y: item.y,
        height: item.boxHeight,
        color: item.style.playheadColor,
        priority,
        opacity: Math.max(opacity, previous?.opacity ?? 0),
      });
    } else {
      previous.opacity = Math.max(previous.opacity, opacity);
    }
  }
  return markers;
}

function resolveBannerLabelCollisions<
  T extends {
    center: number;
    labelX: number;
    textWidth: number;
    y: number;
    fontSize: number;
    boxHeight: number;
    lifted: boolean;
    labelY?: number;
  },
>(words: T[]) {
  // Merge intersecting label groups, then spread their labels symmetrically.
  // Rectangles and anchors are immutable: collisions never alter timing.
  type Group = {
    items: T[];
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  const groups: Group[] = [];
  for (const word of words) {
    let group: Group = {
      items: [word],
      left: word.labelX - word.textWidth / 2,
      right: word.labelX + word.textWidth / 2,
      top: word.y - word.fontSize / 2,
      bottom: word.y + word.fontSize / 2,
    };
    // Check all previous groups: a word in another Y lane can sit between
    // two colliding words in horizontal order. Recheck after lifting, too.
    while (true) {
      const index = groups.findIndex(
        (previous) =>
          previous.right + 4 > group.left &&
          group.right + 4 > previous.left &&
          previous.bottom + 4 > group.top &&
          group.bottom + 4 > previous.top
      );
      if (index === -1) break;
      const previous = groups.splice(index, 1)[0];
      const items = [...previous.items, ...group.items].sort(
        (a, b) => a.center - b.center
      );
      const total =
        items.reduce((sum, item) => sum + item.textWidth, 0) +
        (items.length - 1) * 4;
      const center = (items[0].labelX + items[items.length - 1].labelX) / 2;
      const fontSize = Math.max(...items.map((item) => item.fontSize));
      const y =
        Math.min(...items.map((item) => item.y - item.boxHeight / 2)) -
        fontSize -
        8;
      group = {
        items,
        left: center - total / 2,
        right: center + total / 2,
        top: y - fontSize / 2,
        bottom: Math.max(
          y + fontSize / 2,
          ...items.map((item) => item.y + item.fontSize / 2)
        ),
      };
    }
    groups.push(group);
  }
  for (const group of groups) {
    if (group.items.length < 2) continue;
    let cursor = group.left;
    const top = Math.min(
      ...group.items.map((word) => word.y - word.boxHeight / 2)
    );
    const labelY =
      top - Math.max(...group.items.map((word) => word.fontSize)) - 8;
    for (const word of group.items) {
      word.labelX = cursor + word.textWidth / 2;
      word.lifted = true;
      Object.assign(word, { labelY });
      cursor += word.textWidth + 4;
    }
  }
}
