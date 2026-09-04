import { useNavigate } from "@tanstack/react-router";
import { createElement, useCallback, useEffect } from "react";
import { useProjectViewMode } from "../../hooks/useProjectViewMode";
import { useRecursiveState } from "../../hooks/useRecursiveState";
import { useTranslation } from "../../hooks/useTranslation";
import { type TranslationKey } from "../../i18n/languagePacks";
import { ProjectGridCard } from "./components/ProjectGridCard";
import { ProjectListRow } from "./components/ProjectListRow";
import {
  type ProjectAction,
  type ProjectCover,
  type ProjectFilter,
  type ProjectItem,
} from "./types";

interface ProjectDefinition {
  id: string;
  titleKey: TranslationKey;
  artistKey: TranslationKey;
  updatedKey: TranslationKey;
  duration: string;
  cover: ProjectCover;
  isFavorite: boolean;
  isRecent: boolean;
  isMine: boolean;
}

interface LibraryState extends Record<string, unknown> {
  activeFilter: ProjectFilter;
  openMenuProjectId: string | null;
  favoriteIds: string[];
}

const projectDefinitions: ProjectDefinition[] = [
  {
    id: "bohemian-rhapsody",
    titleKey: "home.demo.bohemianRhapsody.title",
    artistKey: "home.demo.bohemianRhapsody.artist",
    updatedKey: "projects.updated.twoDays",
    duration: "04:21",
    cover: "violet-sunset",
    isFavorite: true,
    isRecent: true,
    isMine: true,
  },
  {
    id: "blinding-lights",
    titleKey: "home.demo.blindingLights.title",
    artistKey: "home.demo.blindingLights.artist",
    updatedKey: "projects.updated.fiveDays",
    duration: "03:36",
    cover: "neon-city",
    isFavorite: false,
    isRecent: true,
    isMine: true,
  },
  {
    id: "hotel-california",
    titleKey: "home.demo.hotelCalifornia.title",
    artistKey: "home.demo.hotelCalifornia.artist",
    updatedKey: "projects.updated.oneWeek",
    duration: "05:28",
    cover: "orange-road",
    isFavorite: false,
    isRecent: true,
    isMine: true,
  },
  {
    id: "sweet-child-o-mine",
    titleKey: "home.demo.sweetChild.title",
    artistKey: "home.demo.sweetChild.artist",
    updatedKey: "projects.updated.oneWeek",
    duration: "04:15",
    cover: "misty-forest",
    isFavorite: false,
    isRecent: true,
    isMine: true,
  },
  {
    id: "creep",
    titleKey: "home.demo.creep.title",
    artistKey: "home.demo.creep.artist",
    updatedKey: "projects.updated.twoWeeks",
    duration: "03:52",
    cover: "night-sky",
    isFavorite: false,
    isRecent: true,
    isMine: true,
  },
  {
    id: "yellow",
    titleKey: "projects.demo.yellow.title",
    artistKey: "projects.demo.yellow.artist",
    updatedKey: "projects.updated.twoWeeks",
    duration: "04:03",
    cover: "blue-jellyfish",
    isFavorite: false,
    isRecent: true,
    isMine: true,
  },
  {
    id: "lose-yourself",
    titleKey: "projects.demo.loseYourself.title",
    artistKey: "projects.demo.loseYourself.artist",
    updatedKey: "projects.updated.threeWeeks",
    duration: "03:20",
    cover: "pink-moon",
    isFavorite: false,
    isRecent: false,
    isMine: true,
  },
  {
    id: "back-in-black",
    titleKey: "projects.demo.backInBlack.title",
    artistKey: "projects.demo.backInBlack.artist",
    updatedKey: "projects.updated.threeWeeks",
    duration: "04:37",
    cover: "red-silhouette",
    isFavorite: true,
    isRecent: false,
    isMine: true,
  },
  {
    id: "dont-stop-believin",
    titleKey: "projects.demo.dontStopBelievin.title",
    artistKey: "projects.demo.dontStopBelievin.artist",
    updatedKey: "projects.updated.oneMonth",
    duration: "03:17",
    cover: "palm-sunset",
    isFavorite: false,
    isRecent: false,
    isMine: true,
  },
  {
    id: "thunderstruck",
    titleKey: "projects.demo.thunderstruck.title",
    artistKey: "projects.demo.thunderstruck.artist",
    updatedKey: "projects.updated.oneMonth",
    duration: "06:12",
    cover: "purple-mountain",
    isFavorite: false,
    isRecent: false,
    isMine: true,
  },
  {
    id: "fix-you",
    titleKey: "projects.demo.fixYou.title",
    artistKey: "projects.demo.fixYou.artist",
    updatedKey: "projects.updated.oneMonth",
    duration: "04:08",
    cover: "magenta-flower",
    isFavorite: false,
    isRecent: false,
    isMine: true,
  },
  {
    id: "someone-like-you",
    titleKey: "projects.demo.someoneLikeYou.title",
    artistKey: "projects.demo.someoneLikeYou.artist",
    updatedKey: "projects.updated.twoMonths",
    duration: "04:45",
    cover: "ocean-dusk",
    isFavorite: false,
    isRecent: false,
    isMine: true,
  },
];

const initialFavoriteIds = projectDefinitions
  .filter((project) => project.isFavorite)
  .map((project) => project.id);

function filterProjects(projects: ProjectItem[], filter: ProjectFilter) {
  switch (filter) {
    case "recent":
      return projects.filter((project) => project.isRecent);
    case "favorites":
      return projects.filter((project) => project.isFavorite);
    case "mine":
      return projects.filter((project) => project.isMine);
    default:
      return projects;
  }
}

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectViewMode, setProjectViewMode } = useProjectViewMode();
  const [state, setState] = useRecursiveState<LibraryState>({
    activeFilter: "all",
    openMenuProjectId: null,
    favoriteIds: initialFavoriteIds,
  });
  const projects = projectDefinitions.map<ProjectItem>((project) => ({
    id: project.id,
    title: t(project.titleKey),
    artist: t(project.artistKey),
    updated: t(project.updatedKey),
    duration: project.duration,
    cover: project.cover,
    isFavorite: state.favoriteIds.includes(project.id),
    isRecent: project.isRecent,
    isMine: project.isMine,
  }));
  const visibleProjects = filterProjects(projects, state.activeFilter);

  const onShowAll = useCallback(
    () => setState({ activeFilter: "all" }),
    [setState]
  );
  const onShowRecent = useCallback(
    () => setState({ activeFilter: "recent" }),
    [setState]
  );
  const onShowFavorites = useCallback(
    () => setState({ activeFilter: "favorites" }),
    [setState]
  );
  const onShowMine = useCallback(
    () => setState({ activeFilter: "mine" }),
    [setState]
  );
  const onShowGrid = useCallback(
    () => setProjectViewMode("grid"),
    [setProjectViewMode]
  );
  const onShowList = useCallback(
    () => setProjectViewMode("list"),
    [setProjectViewMode]
  );
  const onNewProject = useCallback(() => {
    void navigate({ to: "/" });
  }, [navigate]);
  const onToggleActions = useCallback(
    (projectId: string) => {
      setState({
        openMenuProjectId:
          state.openMenuProjectId === projectId ? null : projectId,
      });
    },
    [setState, state.openMenuProjectId]
  );
  const onAction = useCallback(
    (projectId: string, action: ProjectAction) => {
      if (action === "open") {
        void navigate({
          to: "/projects/$projectId/editor",
          params: { projectId },
        });
      }

      if (action === "favorite") {
        const isFavorite = state.favoriteIds.includes(projectId);
        setState({
          favoriteIds: isFavorite
            ? state.favoriteIds.filter((id) => id !== projectId)
            : [...state.favoriteIds, projectId],
        });
      }

      setState({ openMenuProjectId: null });
    },
    [navigate, setState, state.favoriteIds]
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
  const getProjectId = useCallback((project: ProjectItem) => project.id, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-project-actions]")) {
        setState({ openMenuProjectId: null });
      }
    };

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [setState]);

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
    projectCount: projects.length.toString(),
    visibleProjects,
    hasProjects: projects.length > 0,
    hasNoProjects: projects.length === 0,
    allActive: state.activeFilter === "all",
    recentActive: state.activeFilter === "recent",
    favoritesActive: state.activeFilter === "favorites",
    mineActive: state.activeFilter === "mine",
    gridActive: projectViewMode === "grid",
    listActive: projectViewMode === "list",
    onShowAll,
    onShowRecent,
    onShowFavorites,
    onShowMine,
    onShowGrid,
    onShowList,
    onNewProject,
    getProjectId,
    renderGridProject,
    renderListProject,
  };
}
