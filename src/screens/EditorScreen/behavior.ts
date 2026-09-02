import { useParams } from "@tanstack/react-router";
import { useTranslation } from "../../hooks/useTranslation";
export function useBehavior(_: Record<string, never>) {
  const { projectId } = useParams({ from: "/projects/$projectId/editor" });
  const { t } = useTranslation();
  return {
    title: t("editor.project", { projectId }),
    description: t("editor.description"),
  };
}
