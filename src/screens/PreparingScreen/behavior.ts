import { useNavigate, useParams } from "@tanstack/react-router";
import { CircleCheck, CircleDashed, CircleX, LoaderCircle } from "lucide-react";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ProjectStage } from "../../domain/project";
import { useAppContext } from "../../hooks/useAppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { loadProject } from "../../services/projects";
import { PreparationStage, StageProgress, StageProgressFill } from "./styles";

const stageKey = {
  import: "preparing.stages.import",
  separation: "preparing.stages.separation",
  transcription: "preparing.stages.transcription",
  subtitles: "preparing.stages.subtitles",
} as const;

const statusKey = {
  pending: "preparing.status.pending",
  running: "preparing.status.running",
  completed: "preparing.status.completed",
  failed: "preparing.status.failed",
} as const;

const statusIcon = {
  pending: CircleDashed,
  running: LoaderCircle,
  completed: CircleCheck,
  failed: CircleX,
} as const;

export function useBehavior(_: Record<string, never>) {
  const { projectId } = useParams({ from: "/projects/$projectId/preparing" });
  const { t } = useTranslation();
  const [data, setAppData] = useAppContext();
  const navigate = useNavigate();
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [projectName, setProjectName] = useState(projectId);
  const opened = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const project = await loadProject(
        projectId,
        data.preferences.storageDirectory
      );
      if (!project) return;
      setProjectName(project.name);
      setStages(project.processing);
      setAppData({ currentProject: { id: project.id, name: project.name } });
    } catch {
      setStages((current) => current);
    }
  }, [data.preferences.storageDirectory, projectId, setAppData]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const completedCount = stages.filter(
    (stage) => stage.status === "completed"
  ).length;
  const hasFailed = stages.some((stage) => stage.status === "failed");
  const isComplete = stages.length > 0 && completedCount === stages.length;
  const onOpenEditor = useCallback(() => {
    opened.current = true;
    void navigate({ to: "/projects/$projectId/editor", params: { projectId } });
  }, [navigate, projectId]);
  useEffect(() => {
    if (isComplete && !opened.current) onOpenEditor();
  }, [isComplete, onOpenEditor]);
  const uiStages = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        progress:
          stage.status === "completed"
            ? 100
            : (stage.progress ?? (stage.status === "running" ? 8 : 0)),
        label: t(stageKey[stage.id]),
        statusLabel: t(statusKey[stage.status]),
        Icon: statusIcon[stage.status],
      })),
    [stages, t]
  );
  const renderStage = useCallback(
    (stage: (typeof uiStages)[number]) =>
      createElement(
        PreparationStage,
        { $status: stage.status },
        createElement(stage.Icon, { "aria-hidden": true, size: 20 }),
        createElement(
          "div",
          undefined,
          createElement("strong", undefined, stage.label),
          createElement("span", undefined, stage.message ?? stage.statusLabel),
          createElement(
            StageProgress,
            undefined,
            createElement(StageProgressFill, {
              $status: stage.status,
              style: { width: `${stage.progress}%` },
            })
          )
        )
      ),
    []
  );

  return {
    title: t("preparing.title", { project: projectName }),
    description: t(
      hasFailed ? "preparing.description.failed" : "preparing.description"
    ),
    progress:
      stages.length === 0
        ? 0
        : Math.round((completedCount / stages.length) * 100),
    progressLabel: t("preparing.progress", {
      completed: String(completedCount),
      total: String(stages.length || 4),
    }),
    stages: uiStages,
    renderStage,
    getStageId: (stage: (typeof uiStages)[number]) => stage.id,
    hasFailed,
    openEditor: t("preparing.openEditor"),
    onOpenEditor,
  };
}
