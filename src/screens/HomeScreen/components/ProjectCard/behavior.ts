import { useTranslation } from "../../../../hooks/useTranslation";

export type ProjectCover =
  "violet-sunset" | "neon-city" | "orange-road" | "misty-forest" | "night-sky";

export interface RecentProject {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: ProjectCover;
}

export interface ProjectCardProps {
  project: RecentProject;
}

export function useBehavior({ project }: ProjectCardProps) {
  const { t } = useTranslation();

  return {
    title: project.title,
    artist: project.artist,
    duration: project.duration,
    cover: project.cover,
    menuLabel: t("home.recentProjects.actions", { project: project.title }),
  };
}
