import { createElement, type ReactNode } from "react";
import { karaokeModeFor } from "../../util/karaoke/modes";
import type { KaraokePreviewProps } from "../BannerKaraoke/behavior";
export type Props = KaraokePreviewProps & { children: ReactNode };
export function useBehavior(props: Props) {
  const Renderer = karaokeModeFor(props.track).renderer;
  return {
    content: Renderer ? createElement(Renderer, props) : props.children,
  };
}
