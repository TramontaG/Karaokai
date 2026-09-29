import type { ComponentType } from "react";
import type { KaraokeMode } from "../../domain/project";
import type { TranslationKey } from "../../i18n/languagePacks";
import { BannerKaraoke } from "../../components/BannerKaraoke";
import type { KaraokePreviewProps } from "./types";
import { BookKaraoke } from "../../components/BookKaraoke";

import { TeleprompterKaraoke } from "../../components/TeleprompterKaraoke";

// Null renderer retains the legacy Continuity view and old project compatibility.
export const karaokeModes: Record<
  KaraokeMode,
  {
    label: TranslationKey;
    description: TranslationKey;
    renderer: ComponentType<KaraokePreviewProps> | null;
  }
> = {
  continuity: {
    label: "editor.animationTemplateOne",
    description: "editor.animationTemplateOneDescription",
    renderer: null,
  },
  book: {
    label: "editor.book",
    description: "editor.bookDescription",
    renderer: BookKaraoke,
  },
  teleprompter: {
    label: "editor.teleprompter",
    description: "editor.teleprompterDescription",
    renderer: TeleprompterKaraoke,
  },
  banner: {
    label: "editor.banner",
    description: "editor.bannerDescription",
    renderer: BannerKaraoke,
  },
};
export function karaokeModeFor(track: KaraokePreviewProps["track"]) {
  return (
    karaokeModes[track.karaokeMode ?? "continuity"] ?? karaokeModes.continuity
  );
}
