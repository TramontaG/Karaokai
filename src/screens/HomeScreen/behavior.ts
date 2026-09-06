import { createElement, useEffect, useState } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { listProjects, type ProjectSummary } from "../../services/projects";
import { ProjectCard } from "./components/ProjectCard";
import { type RecentProject } from "./components/ProjectCard/behavior";

const covers: RecentProject["cover"][] = [
  "violet-sunset",
  "neon-city",
  "orange-road",
  "misty-forest",
  "night-sky",
];
const formatDuration = (milliseconds: number) =>
  new Date(milliseconds).toISOString().slice(14, 19);

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const [data] = useAppContext();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  useEffect(() => {
    void listProjects(data.preferences.storageDirectory)
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [data.preferences.storageDirectory]);
  const recentProjects = projects
    .slice(0, 5)
    .map<RecentProject>((project, index) => ({
      id: project.id,
      title: project.name,
      artist: t("projects.localProject"),
      duration: formatDuration(project.duration),
      cover: covers[index % covers.length],
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
