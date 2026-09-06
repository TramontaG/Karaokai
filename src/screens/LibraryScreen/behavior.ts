import { useNavigate } from "@tanstack/react-router";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useProjectViewMode } from "../../hooks/useProjectViewMode";
import { useRecursiveState } from "../../hooks/useRecursiveState";
import { useTranslation } from "../../hooks/useTranslation";
import {
  deleteProject,
  duplicateProject,
  ensureProjectThumbnail,
  listProjects,
  openProjectFolder,
  renameProject,
  type ProjectSummary,
} from "../../services/projects";
import { ProjectGridCard } from "./components/ProjectGridCard";
import { ProjectListRow } from "./components/ProjectListRow";
import {
  type ProjectAction,
  type ProjectCover,
  type ProjectFilter,
  type ProjectItem,
} from "./types";

interface LibraryState extends Record<string, unknown> {
  activeFilter: ProjectFilter;
  openMenuProjectId: string | null;
  renameProjectId: string | null;
}

const covers: ProjectCover[] = [
  "violet-sunset",
  "neon-city",
  "orange-road",
  "misty-forest",
  "night-sky",
];
const formatDuration = (milliseconds: number) =>
  new Date(milliseconds).toISOString().slice(14, 19);
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1
  );
  const value = bytes / 1024 ** (unitIndex + 1);
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} ${units[unitIndex]}`;
};
const isRecent = (updatedAt: string) =>
  Date.now() - Number(updatedAt) < 7 * 24 * 60 * 60 * 1000;

function filterProjects(projects: ProjectItem[], filter: ProjectFilter) {
  if (filter === "recent")
    return projects.filter((project) => project.isRecent);
  if (filter === "favorites")
    return projects.filter((project) => project.isFavorite);
  if (filter === "mine") return projects.filter((project) => project.isMine);
  return projects;
}

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setAppData] = useAppContext();
  const { projectViewMode, setProjectViewMode } = useProjectViewMode();
  const [storedProjects, setStoredProjects] = useState<ProjectSummary[]>([]);
  const [state, setState] = useRecursiveState<LibraryState>({
    activeFilter: "all",
    openMenuProjectId: null,
    renameProjectId: null,
  });
  const refresh = useCallback(() => {
    void listProjects(data.preferences.storageDirectory)
      .then((projects) =>
        Promise.all(
          projects.map((project) =>
            ensureProjectThumbnail(
              project,
              data.preferences.storageDirectory
            ).catch(() => project)
          )
        )
      )
      .then(setStoredProjects)
      .catch(() => setStoredProjects([]));
  }, [data.preferences.storageDirectory]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const projects = useMemo(
    () =>
      storedProjects.map<ProjectItem>((project, index) => ({
        id: project.id,
        title: project.name,
        artist: t("projects.localProject"),
        duration: formatDuration(project.duration),
        size: formatFileSize(project.sizeBytes),
        updated: Number(project.updatedAt)
          ? new Date(Number(project.updatedAt)).toLocaleString()
          : t("projects.updated.now"),
        cover: covers[index % covers.length],
        thumbnail: project.thumbnail ?? null,
        isFavorite: data.preferences.favoriteProjectIds.includes(project.id),
        isRecent: isRecent(project.updatedAt),
        isMine: true,
      })),
    [data.preferences.favoriteProjectIds, storedProjects, t]
  );
  const visibleProjects = filterProjects(projects, state.activeFilter);
  const setFilter = useCallback(
    (activeFilter: ProjectFilter) => setState({ activeFilter }),
    [setState]
  );
  const onToggleActions = useCallback(
    (projectId: string) =>
      setState({
        openMenuProjectId:
          state.openMenuProjectId === projectId ? null : projectId,
      }),
    [setState, state.openMenuProjectId]
  );
  const onAction = useCallback(
    async (projectId: string, action: ProjectAction) => {
      const project = projects.find((item) => item.id === projectId);
      if (action === "open") {
        if (project)
          setAppData({
            currentProject: { id: project.id, name: project.title },
          });
        void navigate({
          to: "/projects/$projectId/editor",
          params: { projectId },
        });
      }
      if (action === "rename" && project)
        setState({ renameProjectId: projectId });
      if (action === "favorite")
        setAppData({
          preferences: {
            favoriteProjectIds: data.preferences.favoriteProjectIds.includes(
              projectId
            )
              ? data.preferences.favoriteProjectIds.filter(
                  (id) => id !== projectId
                )
              : [...data.preferences.favoriteProjectIds, projectId],
          },
        });
      if (action === "duplicate") {
        await duplicateProject(projectId, data.preferences.storageDirectory);
        refresh();
      }
      if (action === "export" && project) {
        setAppData({
          currentProject: { id: project.id, name: project.title },
          requestedEditorAction: { projectId, action: "export" },
        });
        void navigate({
          to: "/projects/$projectId/editor",
          params: { projectId },
        });
      }
      if (action === "open-folder")
        await openProjectFolder(projectId, data.preferences.storageDirectory);
      if (action === "delete") {
        if (
          project &&
          window.confirm(
            t("projects.deleteConfirmation", { project: project.title })
          )
        ) {
          await deleteProject(projectId, data.preferences.storageDirectory);
          if (data.currentProject?.id === projectId)
            setAppData({ currentProject: null });
          if (data.preferences.favoriteProjectIds.includes(projectId))
            setAppData({
              preferences: {
                favoriteProjectIds: data.preferences.favoriteProjectIds.filter(
                  (id) => id !== projectId
                ),
              },
            });
          refresh();
        }
      }
      setState({ openMenuProjectId: null });
    },
    [
      data.preferences.storageDirectory,
      data.preferences.favoriteProjectIds,
      data.currentProject?.id,
      navigate,
      projects,
      refresh,
      setAppData,
      setState,
      t,
    ]
  );
  const renderGridProject = useCallback(
    (project: ProjectItem) =>
      createElement(ProjectGridCard, {
        project,
        actionsOpen: state.openMenuProjectId === project.id,
        onToggleActions,
        onAction,
      }),
    [onAction, onToggleActions, state.openMenuProjectId]
  );
  const renderListProject = useCallback(
    (project: ProjectItem) =>
      createElement(ProjectListRow, {
        project,
        actionsOpen: state.openMenuProjectId === project.id,
        onToggleActions,
        onAction,
      }),
    [onAction, onToggleActions, state.openMenuProjectId]
  );
  const onNewProject = useCallback(
    () => void navigate({ to: "/" }),
    [navigate]
  );
  const renameTarget =
    projects.find((project) => project.id === state.renameProjectId) ?? null;
  const onCancelRename = useCallback(
    () => setState({ renameProjectId: null }),
    [setState]
  );
  const onConfirmRename = useCallback(
    async (name: string) => {
      if (!renameTarget) return;
      await renameProject(
        renameTarget.id,
        name,
        data.preferences.storageDirectory
      );
      if (data.currentProject?.id === renameTarget.id)
        setAppData({
          currentProject: { id: renameTarget.id, name },
        });
      setState({ renameProjectId: null });
      refresh();
    },
    [
      data.currentProject?.id,
      data.preferences.storageDirectory,
      refresh,
      renameTarget,
      setAppData,
      setState,
    ]
  );

  return {
    title: t("projects.title"),
    description: t("projects.description"),
    newProject: t("projects.new"),
    filterLabel: t("projects.filters.label"),
    all: t("projects.filters.all"),
    recent: t("projects.filters.recent"),
    favorites: t("projects.filters.favorites"),
    mine: t("projects.filters.mine"),
    sortLabel: t("projects.sort.label"),
    sortRecent: t("projects.sort.recent"),
    gridLabel: t("projects.view.grid"),
    listLabel: t("projects.view.list"),
    nameColumn: t("projects.table.name"),
    artistColumn: t("projects.table.artist"),
    durationColumn: t("projects.table.duration"),
    sizeColumn: t("projects.table.size"),
    updatedColumn: t("projects.table.updated"),
    actionsColumn: t("projects.table.actions"),
    emptyTitlePrefix: t("home.hero.titlePrefix"),
    emptyTitleHighlight: t("home.hero.titleHighlight"),
    emptyDescription: t("home.hero.description"),
    localLabel: t("projects.empty.local"),
    privateLabel: t("projects.empty.private"),
    unlimitedLabel: t("projects.empty.unlimited"),
    projectCount: String(projects.length),
    visibleProjects,
    hasProjects: projects.length > 0,
    hasNoProjects: projects.length === 0,
    allActive: state.activeFilter === "all",
    recentActive: state.activeFilter === "recent",
    favoritesActive: state.activeFilter === "favorites",
    mineActive: state.activeFilter === "mine",
    gridActive: projectViewMode === "grid",
    listActive: projectViewMode === "list",
    onShowAll: () => setFilter("all"),
    onShowRecent: () => setFilter("recent"),
    onShowFavorites: () => setFilter("favorites"),
    onShowMine: () => setFilter("mine"),
    onShowGrid: () => setProjectViewMode("grid"),
    onShowList: () => setProjectViewMode("list"),
    onNewProject,
    renameProject: renameTarget,
    renameTitle: t("projects.rename.title"),
    renameFieldLabel: t("projects.rename.field"),
    renameCancelLabel: t("projects.rename.cancel"),
    renameConfirmLabel: t("projects.rename.confirm"),
    onCancelRename,
    onConfirmRename,
    getProjectId: (project: ProjectItem) => project.id,
    renderGridProject,
    renderListProject,
  };
}
