import {
  createElement,
  useEffect,
  useId,
  useMemo,
  type CSSProperties,
} from "react";
import { useRecursiveState } from "./useRecursiveState";
import { bookViewAt, layoutBook } from "../util/karaoke/book";
import type { KaraokePreviewProps } from "../util/karaoke/types";

export function useTextKaraoke(
  { track, currentTime }: KaraokePreviewProps,
  makeLayout: typeof layoutBook,
  viewAt: typeof bookViewAt,
  mode: string
) {
  const prefix = useId();
  const [{ fontRevision }, setState] = useRecursiveState({ fontRevision: 0 });
  useEffect(() => {
    const refresh = () =>
      setState((state) => ({ fontRevision: state.fontRevision + 1 }));
    document.fonts.addEventListener("loadingdone", refresh);
    return () => document.fonts.removeEventListener("loadingdone", refresh);
  }, [setState]);
  const layout = useMemo(() => {
    const context = document.createElement("canvas").getContext("2d")!;
    return makeLayout(track, (text, font) => {
      context.font = font;
      const result = context.measureText(text);
      const bearing = Math.max(0, result.actualBoundingBoxLeft);
      return {
        width: Math.max(result.width, result.actualBoundingBoxRight) + bearing,
        ascent: result.actualBoundingBoxAscent,
        descent: result.actualBoundingBoxDescent,
        bearing,
      };
    });
  }, [track, fontRevision, makeLayout]);
  const phrases = viewAt(layout, currentTime);
  type Phrase = (typeof phrases)[number];
  type Word = Phrase["words"][number];
  const clipId = (word: Word) => `${prefix}-read-${word.id}`;
  const renderClip = (word: Word) => {
    // Canvas bounds are tight; SVG rasterization and italic/accented glyphs
    // can extend beyond them. Pad every edge except the moving read boundary.
    const padding = Math.max(2, word.fontSize * 0.25);
    return createElement(
      "clipPath",
      { id: clipId(word), clipPathUnits: "userSpaceOnUse" },
      createElement("rect", {
        x: word.x - padding,
        y: word.y - word.ascent - padding,
        width: word.progress > 0 ? padding + word.width * word.progress : 0,
        height: word.ascent + word.descent + padding * 2,
      })
    );
  };
  const renderWord = (word: Word) => {
    const attributes = {
      x: word.x + word.bearing,
      y: word.y,
      style: { font: word.font, textDecoration: word.style.textDecoration },
    };
    return createElement(
      "g",
      {
        key: word.id,
        "data-book-word-id": word.word.id,
        "data-progress": word.progress,
      },
      createElement(
        "text",
        {
          ...attributes,
          fill:
            word.progress >= 1 ? word.style.readColor : word.style.unreadColor,
          style: {
            ...attributes.style,
            textShadow: "0 0.16rem 0.2rem #000, 0 0 0.45rem #000",
          },
        },
        word.word.text
      ),
      createElement(
        "text",
        {
          ...attributes,
          fill: word.style.readColor,
          // Once read, paint the whole base glyph without a clip or a second
          // antialiased layer that could leave an unread fringe.
          display: word.progress >= 1 ? "none" : undefined,
          clipPath: `url(#${clipId(word)})`,
        },
        word.word.text
      )
    );
  };
  const renderCue = (phrase: Phrase) => {
    const cue = phrase.cue;
    if (!cue) return null;
    const rect = {
      x: cue.x,
      y: cue.y,
      width: cue.width,
      height: cue.height,
      rx: cue.height / 2,
    };
    return createElement(
      "g",
      {
        "data-book-cue": cue.progress,
        style: { filter: "drop-shadow(0 1px 2px #0008)" },
      },
      createElement("rect", { ...rect, fill: cue.unreadColor }),
      createElement("rect", {
        ...rect,
        width: cue.width * cue.progress,
        fill: cue.readColor,
      })
    );
  };
  return {
    mode,
    phrases,
    words: phrases.flatMap((phrase) => phrase.words),
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
    getPhraseId: (phrase: Phrase) => phrase.id,
    getWordId: (word: Word) => word.id,
    renderClip,
    renderPhrase: (phrase: Phrase) =>
      createElement(
        "g",
        {
          "data-book-phrase-id": phrase.phrase.id,
          "data-book-slot": phrase.slot,
          "data-active": phrase.active,
          opacity: phrase.opacity,
        },
        renderCue(phrase),
        ...phrase.words.map(renderWord)
      ),
  };
}
