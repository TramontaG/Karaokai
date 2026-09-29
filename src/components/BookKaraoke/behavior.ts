import type { KaraokePreviewProps } from "../../util/karaoke/types";
import { layoutBook, bookViewAt } from "../../util/karaoke/book";
import { useTextKaraoke } from "../../hooks/useTextKaraoke";

export function useBehavior(props: KaraokePreviewProps) {
  return useTextKaraoke(props, layoutBook, bookViewAt, "book");
}
