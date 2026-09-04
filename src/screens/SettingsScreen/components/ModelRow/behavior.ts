import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type ModelStatus } from "../../../../services/models";

export type ModelAction =
  "set-default" | "verify" | "open-folder" | "details" | "remove";

export interface ModelRowProps {
  model: ModelStatus;
  isDefault: boolean;
  menuOpen: boolean;
  onToggleMenu: (modelId: string) => void;
  onAction: (modelId: string, action: ModelAction) => void;
  onDownload: (model: ModelStatus) => void;
}

export function useBehavior({
  model,
  isDefault,
  menuOpen,
  onToggleMenu,
  onAction,
  onDownload,
}: ModelRowProps) {
  const { t } = useTranslation();
  const progress = Math.min(100, Math.max(0, Math.round(model.progress ?? 0)));
  const onMenuClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggleMenu(model.id);
    },
    [model.id, onToggleMenu]
  );
  const runAction = useCallback(
    (action: ModelAction) => onAction(model.id, action),
    [model.id, onAction]
  );
  const onSetDefault = useCallback(() => runAction("set-default"), [runAction]);
  const onVerify = useCallback(() => runAction("verify"), [runAction]);
  const onOpenFolder = useCallback(() => runAction("open-folder"), [runAction]);
  const onDetails = useCallback(() => runAction("details"), [runAction]);
  const onRemove = useCallback(() => runAction("remove"), [runAction]);
  const onDownloadClick = useCallback(
    () => onDownload(model),
    [model, onDownload]
  );

  return {
    name: model.name,
    sizeLabel: model.sizeLabel,
    backend: model.kind === "whisper" ? "CTranslate2" : "PyTorch",
    statusLabel: model.downloading
      ? t("models.downloading")
      : model.installed
        ? t("settings.status.installed")
        : t("settings.status.notInstalled"),
    actionLabel: t("models.download"),
    progress,
    progressLabel: t("models.installingProgress", {
      progress: String(progress),
    }),
    progressAriaLabel: t("models.installingProgressLabel", {
      model: model.name,
      progress: String(progress),
    }),
    defaultBadge: t("settings.models.defaultBadge"),
    setDefaultLabel: t("settings.models.actions.setDefault"),
    isInstalled: model.installed,
    isDownloading: model.downloading === true,
    showDownloadButton: !model.installed && model.downloading !== true,
    showInstallProgress: !model.installed && model.downloading === true,
    isDefault,
    isNotDefault: !isDefault,
    menuOpen,
    menuButtonLabel: t("settings.actions.openMenu", { item: model.name }),
    menuLabel: t("settings.actions.menu", { item: model.name }),
    openFolderLabel: t("settings.actions.openFolder"),
    verifyLabel: t("settings.models.actions.verify"),
    updatesLabel: t("settings.actions.checkUpdates"),
    detailsLabel: t("settings.actions.details"),
    removeLabel: t("settings.models.actions.remove"),
    onMenuClick,
    onSetDefault,
    onVerify,
    onOpenFolder,
    onDetails,
    onRemove,
    onDownloadClick,
  };
}
