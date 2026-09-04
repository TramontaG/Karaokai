import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type RuntimeComponentStatus } from "../../../../services/runtime";

export type DependencyAction =
  "open-folder" | "verify" | "updates" | "details" | "install" | "remove";

export interface DependencyRowProps {
  component: RuntimeComponentStatus;
  menuOpen: boolean;
  installing: boolean;
  onToggleMenu: (componentId: string) => void;
  onAction: (componentId: string, action: DependencyAction) => void;
}

export function useBehavior({
  component,
  menuOpen,
  installing,
  onToggleMenu,
  onAction,
}: DependencyRowProps) {
  const { t } = useTranslation();
  const onMenuClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggleMenu(component.id);
    },
    [component.id, onToggleMenu]
  );
  const runAction = useCallback(
    (action: DependencyAction) => onAction(component.id, action),
    [component.id, onAction]
  );
  const onOpenFolder = useCallback(() => runAction("open-folder"), [runAction]);
  const onVerify = useCallback(() => runAction("verify"), [runAction]);
  const onCheckUpdates = useCallback(() => runAction("updates"), [runAction]);
  const onDetails = useCallback(() => runAction("details"), [runAction]);
  const onRemove = useCallback(() => runAction("remove"), [runAction]);
  const onInstall = useCallback(() => runAction("install"), [runAction]);

  return {
    name: component.name,
    installedVersion:
      component.installedVersion ?? t("settings.dependencies.unknownVersion"),
    platform: component.platform,
    sizeLabel: component.sizeLabel,
    statusLabel: component.installed
      ? t("settings.status.installed")
      : t("settings.status.notInstalled"),
    updateLabel: component.installed
      ? component.updateAvailable
        ? t("settings.status.updateAvailable")
        : t("settings.status.updated")
      : t("settings.status.unavailable"),
    isInstalled: component.installed,
    isVerified: component.verified,
    isFfmpeg: component.id === "ffmpeg",
    isWorker: component.id === "ml-worker",
    isYtDlp: component.id === "yt-dlp",
    canInstall: component.id === "yt-dlp" && !component.installed,
    showUpdateStatus: component.id !== "yt-dlp" || component.installed,
    showMenu: component.id !== "yt-dlp" || component.installed,
    installLabel: installing
      ? t("settings.dependencies.actions.installing")
      : t("settings.dependencies.actions.install"),
    installing,
    menuOpen,
    menuButtonLabel: t("settings.actions.openMenu", {
      item: component.name,
    }),
    menuLabel: t("settings.actions.menu", { item: component.name }),
    openFolderLabel: t("settings.actions.openFolder"),
    verifyLabel: t("settings.dependencies.actions.verify"),
    updatesLabel: t("settings.actions.checkUpdates"),
    detailsLabel: t("settings.actions.details"),
    defaultLabel: t("settings.models.actions.setDefault"),
    removeLabel: t("settings.dependencies.actions.remove"),
    onMenuClick,
    onOpenFolder,
    onVerify,
    onCheckUpdates,
    onDetails,
    onRemove,
    onInstall,
  };
}
