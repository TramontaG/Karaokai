import type { KaraokePreviewProps } from "../../util/karaoke/types";
import {
  layoutTeleprompter,
  teleprompterViewAt,
} from "../../util/karaoke/teleprompter";
import { useTextKaraoke } from "../../hooks/useTextKaraoke";

export function useBehavior(props: KaraokePreviewProps) {
  return useTextKaraoke(
    props,
    layoutTeleprompter,
    teleprompterViewAt,
    "teleprompter"
  );
}
