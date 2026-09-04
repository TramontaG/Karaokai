import { useCallback, type FormEvent } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const onYoutubeSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  return {
    acceptedFiles: ".mp3,.wav,.flac,.m4a,.aac,.ogg,audio/*",
    dropTitle: t("home.import.dropTitle"),
    supportedFormats: t("home.import.supportedFormats"),
    chooseFile: t("home.import.chooseFile"),
    fileInputLabel: t("home.import.fileInputLabel"),
    separator: t("home.import.separator"),
    youtubePlaceholder: t("home.import.youtubePlaceholder"),
    youtubeInputLabel: t("home.import.youtubeInputLabel"),
    download: t("home.import.download"),
    onYoutubeSubmit,
  };
}
