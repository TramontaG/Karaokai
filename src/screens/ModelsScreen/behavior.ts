import { useCallback } from "react";
import { useModels } from "../../hooks/useModels";
import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { models, download } = useModels();
  const { t } = useTranslation();
  const model = models[0] ?? {
    id: "whisper-tiny",
    name: "Whisper Tiny",
    category: t("models.category"),
    sizeLabel: "~78 MB",
    installed: false,
  };
  const onDownload = useCallback(() => {
    void download(model);
  }, [download, model]);
  return {
    pageTitle: t("models.title"),
    model,
    onDownload,
    actionDisabled: model.installed || model.downloading === true,
    actionLabel: model.installed
      ? t("models.installed")
      : model.downloading
        ? t("models.downloading")
        : t("models.download"),
  };
}
