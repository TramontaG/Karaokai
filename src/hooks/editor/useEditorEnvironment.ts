import { useNavigate, useParams } from "@tanstack/react-router";
import { useAppContext } from "../../hooks/useAppContext";
import { useTimelineAutoFollow } from "../../hooks/useTimelineAutoFollow";
import { useTranslation } from "../../hooks/useTranslation";

export function useEditorEnvironment() {
  const { projectId } = useParams({ from: "/projects/$projectId/editor" });

  const navigate = useNavigate();

  const { t } = useTranslation();

  const { timelineAutoFollow, setTimelineAutoFollow } = useTimelineAutoFollow();

  const [data, setAppData] = useAppContext();
  return {
    data,
    projectId,
    setAppData,
    navigate,
    t,
    timelineAutoFollow,
    setTimelineAutoFollow,
  };
}

export type EditorEnvironment = ReturnType<typeof useEditorEnvironment>;
