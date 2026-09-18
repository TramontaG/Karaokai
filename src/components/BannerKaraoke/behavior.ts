import { useRecursiveState } from "../../hooks/useRecursiveState";
import { createElement, useEffect, useMemo, useId } from "react";
import type { CSSProperties } from "react";
import { type SubtitleTrack } from "../../domain/project";
import {
  bannerWordState,
  layoutBanner,
  bannerPlayheadsAt,
} from "../../util/karaoke/banner";

export interface KaraokePreviewProps {
  track: SubtitleTrack;
  currentTime: number;
}

export function useBehavior({ track, currentTime }: KaraokePreviewProps) {
  const clipPrefix = useId();
  const [{ fontRevision }, setState] = useRecursiveState({ fontRevision: 0 });
  useEffect(() => {
    const refresh = () =>
      setState((state) => ({ fontRevision: state.fontRevision + 1 }));
    document.fonts.addEventListener("loadingdone", refresh);
    return () => document.fonts.removeEventListener("loadingdone", refresh);
  }, []);
  const layout = useMemo(() => {
    const context = document.createElement("canvas").getContext("2d")!;
    return layoutBanner(track, (text, font) => {
      context.font = font;
      return context.measureText(text).width;
    });
  }, [track, fontRevision]);
  const offset = (currentTime / 1000) * layout.speed;
  const visibleSegments = layout.segments.filter(
    (word) =>
      Math.max(word.right, word.labelX + word.textWidth / 2) - offset >= -16 &&
      Math.min(word.left, word.labelX - word.textWidth / 2) - offset <=
        layout.width + 16
  );
  const visibleWords = visibleSegments.filter((segment) => !segment.isGap);
  const gapPatternId = `${clipPrefix}-gap`;
  const visibleGroupIndices = new Set(
    visibleSegments.map((word) => word.groupIndex)
  );
  const groups = layout.groups.filter((phrase) =>
    visibleGroupIndices.has(phrase.groupIndex)
  );
  const clipId = (groupIndex: number) => `${clipPrefix}-phrase-${groupIndex}`;
  const renderGroupClip = (phrase: (typeof layout.groups)[number]) =>
    createElement(
      "clipPath",
      {
        id: clipId(phrase.groupIndex),
        clipPathUnits: "userSpaceOnUse",
      },
      createElement("rect", {
        x: phrase.left - offset,
        y: phrase.top,
        width: phrase.right - phrase.left,
        height: phrase.bottom - phrase.top,
        rx: phrase.radius,
      })
    );
  const renderRectangle = (item: (typeof layout.segments)[number]) => {
    const bounds = {
      x: item.left - offset,
      y: item.y - item.boxHeight / 2,
      width: item.right - item.left,
      height: item.boxHeight,
    };
    const phrase = layout.groups.find(
      (candidate) => candidate.groupIndex === item.groupIndex
    );
    const dividerWidth = Math.min(1.5, bounds.width);
    return createElement(
      "g",
      {
        key: item.id,
        clipPath: `url(#${clipId(item.groupIndex)})`,
        opacity: item.style.bannerRectangleOpacity,
        "data-banner-segment-id": item.word.id,
        "data-banner-segment-type": item.isGap ? "gap" : "word",
      },
      createElement("rect", {
        ...bounds,
        fill: item.style[
          `${bannerWordState(item.word.start, item.word.end, currentTime)}RectangleColor`
        ],
      }),
      item.isGap
        ? createElement("rect", { ...bounds, fill: `url(#${gapPatternId})` })
        : null,
      phrase && item.right < phrase.right && dividerWidth > 0
        ? createElement("rect", {
            x: bounds.x + bounds.width - dividerWidth,
            y: bounds.y,
            width: dividerWidth,
            height: bounds.height,
            fill: "white",
            fillOpacity: 0.5,
          })
        : null
    );
  };
  // Filter the combined phrase silhouette, avoiding shadows between its words.
  // Text and playhead stay in their own layers; segment opacity also scales the shadow.
  const renderGroupRectangles = (phrase: (typeof layout.groups)[number]) =>
    createElement(
      "g",
      {
        "data-banner-group-id": phrase.id,
        style: { filter: "drop-shadow(0 3px 4px rgb(0 0 0 / 65%))" },
      },
      ...visibleSegments
        .filter((segment) => segment.groupIndex === phrase.groupIndex)
        .map(renderRectangle)
    );
  const renderWord = (item: (typeof layout.words)[number]) => {
    const state = bannerWordState(item.word.start, item.word.end, currentTime);
    const color =
      state === "current"
        ? item.style.currentColor
        : state === "read"
          ? item.style.readColor
          : item.style.unreadColor;
    const labelY = item.labelY ?? item.y;
    return createElement(
      "g",
      { "data-banner-word-id": item.word.id, "data-state": state },
      item.lifted
        ? createElement("line", {
            x1: item.center - offset,
            y1: item.y - item.boxHeight / 2,
            x2: item.labelX - offset,
            y2: labelY + item.fontSize / 2,
            stroke: color,
            strokeWidth: 1,
          })
        : null,
      createElement(
        "text",
        {
          x: item.labelX - offset,
          y: labelY,
          textAnchor: "middle",
          dominantBaseline: "central",
          fill: color,
          style: {
            font: item.font,
            textDecoration: item.style.textDecoration,
            textShadow: "0 0.16rem 0.2rem #000, 0 0 0.45rem #000",
          },
        },
        item.word.text
      )
    );
  };
  const markers = bannerPlayheadsAt(layout, currentTime);
  return {
    viewBox: `0 0 ${layout.width} ${layout.height}`,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: track.zIndex,
    } satisfies CSSProperties,
    words: visibleWords,
    segments: visibleSegments,
    gapPatternId,
    gapPatternTransform: `translate(${-offset}, 0) rotate(45)`,
    renderWord,
    renderGroupRectangles,
    groups,
    renderGroupClip,
    getGroupId: (phrase: (typeof layout.groups)[number]) =>
      String(phrase.groupIndex),
    markers: [...markers.entries()],
    getWordId: (word: (typeof layout.words)[number]) => word.id,
    getMarkerId: (entry: [string, unknown]) => entry[0],
    renderMarker: ([, marker]: [
      string,
      typeof markers extends Map<string, infer M> ? M : never,
    ]) =>
      createElement("rect", {
        x: marker.x - 1,
        y: marker.y - marker.height / 2 - 8,
        width: 2,
        height: marker.height + 16,
        fill: marker.color,
        opacity: marker.opacity,
        "data-banner-playhead": true,
      }),
  };
}
