import { createElement } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { type TranslationKey } from "../../i18n/languagePacks";
import { ProjectCard } from "./components/ProjectCard";
import { type RecentProject } from "./components/ProjectCard/behavior";

interface ProjectDefinition {
  id: string;
  titleKey: TranslationKey;
  artistKey: TranslationKey;
  duration: string;
  cover: RecentProject["cover"];
}

const projectDefinitions: ProjectDefinition[] = [
  {
    id: "bohemian-rhapsody",
    titleKey: "home.demo.bohemianRhapsody.title",
    artistKey: "home.demo.bohemianRhapsody.artist",
    duration: "04:21",
    cover: "violet-sunset",
  },
  {
    id: "blinding-lights",
    titleKey: "home.demo.blindingLights.title",
    artistKey: "home.demo.blindingLights.artist",
    duration: "03:36",
    cover: "neon-city",
  },
  {
    id: "hotel-california",
    titleKey: "home.demo.hotelCalifornia.title",
    artistKey: "home.demo.hotelCalifornia.artist",
    duration: "05:28",
    cover: "orange-road",
  },
  {
    id: "sweet-child-o-mine",
    titleKey: "home.demo.sweetChild.title",
    artistKey: "home.demo.sweetChild.artist",
    duration: "04:15",
    cover: "misty-forest",
  },
  {
    id: "creep",
    titleKey: "home.demo.creep.title",
    artistKey: "home.demo.creep.artist",
    duration: "03:52",
    cover: "night-sky",
  },
];

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const recentProjects = projectDefinitions.map((project) => ({
    id: project.id,
    title: t(project.titleKey),
    artist: t(project.artistKey),
    duration: project.duration,
    cover: project.cover,
  }));

  return {
    titlePrefix: t("home.hero.titlePrefix"),
    titleHighlight: t("home.hero.titleHighlight"),
    description: t("home.hero.description"),
    recentProjectsTitle: t("home.recentProjects.title"),
    viewAll: t("home.recentProjects.viewAll"),
    recentProjects,
    getProjectId: (project: RecentProject) => project.id,
    renderProject: (project: RecentProject) =>
      createElement(ProjectCard, { project }),
  };
}
