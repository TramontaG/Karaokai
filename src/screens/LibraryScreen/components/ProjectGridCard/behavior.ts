import { useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type ProjectAction, type ProjectItem } from "../../types";

export interface ProjectGridCardProps {
  project: ProjectItem;
  actionsOpen: boolean;
  onToggleActions: (projectId: string) => void;
  onAction: (projectId: string, action: ProjectAction) => void;
}

export function useBehavior({
  project,
  actionsOpen,
  onToggleActions,
  onAction,
}: ProjectGridCardProps) {
  const { t } = useTranslation();
  const onMenuClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggleActions(project.id);
    },
    [onToggleActions, project.id]
  );
  const onCardClick = useCallback(
    () => onAction(project.id, "open"),
    [onAction, project.id]
  );
  const onCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.currentTarget !== event.target) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onCardClick();
    },
    [onCardClick]
  );
  const onActionsClick = useCallback(
    (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    []
  );
  const runAction = useCallback(
    (action: ProjectAction) => onAction(project.id, action),
    [onAction, project.id]
  );
  const onFavoriteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      runAction("favorite");
    },
    [runAction]
  );
  const onOpen = useCallback(() => runAction("open"), [runAction]);
  const onRename = useCallback(() => runAction("rename"), [runAction]);
  const onToggleFavorite = useCallback(
    () => runAction("favorite"),
    [runAction]
  );
  const onDuplicate = useCallback(() => runAction("duplicate"), [runAction]);
  const onExport = useCallback(() => runAction("export"), [runAction]);
  const onOpenFolder = useCallback(() => runAction("open-folder"), [runAction]);
  const onDelete = useCallback(() => runAction("delete"), [runAction]);

  return {
    id: project.id,
    title: project.title,
    artist: project.artist,
    duration: project.duration,
    size: project.size,
    thumbnail: project.thumbnail,
    updated: project.updated,
    cover: project.cover,
    isFavorite: project.isFavorite,
    favoriteFill: project.isFavorite ? "currentColor" : "none",
    actionsOpen,
    onCardClick,
    onCardKeyDown,
    onActionsClick,
    onFavoriteClick,
    actionsButtonLabel: t("projects.actions.openMenu", {
      project: project.title,
    }),
    menuLabel: t("projects.actions.menu", { project: project.title }),
    openLabel: t("projects.actions.open"),
    renameLabel: t("projects.actions.rename"),
    favoriteLabel: t(
      project.isFavorite
        ? "projects.actions.removeFavorite"
        : "projects.actions.addFavorite"
    ),
    duplicateLabel: t("projects.actions.duplicate"),
    exportLabel: t("projects.actions.export"),
    openFolderLabel: t("projects.actions.openFolder"),
    deleteLabel: t("projects.actions.delete"),
    favoriteButtonLabel: t(
      project.isFavorite ? "projects.favorite.remove" : "projects.favorite.add",
      { project: project.title }
    ),
    onMenuClick,
    onOpen,
    onRename,
    onToggleFavorite,
    onDuplicate,
    onExport,
    onOpenFolder,
    onDelete,
  };
}
