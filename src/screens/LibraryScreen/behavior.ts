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
  listProjects,
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
  favoriteIds: string[];
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
  const [data] = useAppContext();
  const { projectViewMode, setProjectViewMode } = useProjectViewMode();
  const [storedProjects, setStoredProjects] = useState<ProjectSummary[]>([]);
  const [state, setState] = useRecursiveState<LibraryState>({
    activeFilter: "all",
    openMenuProjectId: null,
    favoriteIds: [],
  });
  const refresh = useCallback(() => {
    void listProjects(data.preferences.storageDirectory)
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
        updated: Number(project.updatedAt)
          ? new Date(Number(project.updatedAt)).toLocaleString()
          : t("projects.updated.now"),
        cover: covers[index % covers.length],
        isFavorite: state.favoriteIds.includes(project.id),
        isRecent: isRecent(project.updatedAt),
        isMine: true,
      })),
    [state.favoriteIds, storedProjects, t]
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
      if (action === "open")
        void navigate({
          to: "/projects/$projectId/editor",
          params: { projectId },
        });
      if (action === "favorite")
        setState({
          favoriteIds: state.favoriteIds.includes(projectId)
            ? state.favoriteIds.filter((id) => id !== projectId)
            : [...state.favoriteIds, projectId],
        });
      if (action === "delete") {
        const project = projects.find((item) => item.id === projectId);
        if (
          project &&
          window.confirm(
            t("projects.deleteConfirmation", { project: project.title })
          )
        ) {
          await deleteProject(projectId, data.preferences.storageDirectory);
          refresh();
        }
      }
      setState({ openMenuProjectId: null });
    },
    [
      data.preferences.storageDirectory,
      navigate,
      projects,
      refresh,
      setState,
      state.favoriteIds,
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
    getProjectId: (project: ProjectItem) => project.id,
    renderGridProject,
    renderListProject,
  };
}
