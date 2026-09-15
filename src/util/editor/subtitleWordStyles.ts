import type { CSSProperties } from "react";
import {
  subtitleFontStack,
  type resolveSubtitleStyle,
} from "../../domain/project";

type WordAppearance = Pick<
  ReturnType<typeof resolveSubtitleStyle>,
  | "unreadColor"
  | "readColor"
  | "fontFamily"
  | "scale"
  | "verticalAlign"
  | "fontWeight"
  | "fontStyle"
  | "textDecoration"
> & {
  progress: number;
  offsetX: number;
  offsetY: number;
};

// Continuous values belong on the element, not in Emotion's session-long cache.
export function withSubtitleWordStyles<T extends WordAppearance>(word: T) {
  return {
    ...word,
    previewStyle: {
      transform: `translate(${word.offsetX}cqw, ${word.offsetY}cqw)`,
      color: word.unreadColor,
      fontFamily: subtitleFontStack(word.fontFamily),
      fontSize: `${word.scale * (word.verticalAlign === "baseline" ? 1 : 0.75)}em`,
      fontWeight: word.fontWeight,
      fontStyle: word.fontStyle,
      textDecoration: word.textDecoration,
      verticalAlign: word.verticalAlign,
    } satisfies CSSProperties,
    fillStyle: {
      width: `${Math.min(100, Math.max(0, word.progress * 100))}%`,
      color: word.readColor,
    } satisfies CSSProperties,
  };
}
