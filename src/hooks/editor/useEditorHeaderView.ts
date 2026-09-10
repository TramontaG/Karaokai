import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorSession } from "./useEditorSession";

interface Options {
  editorDataState: Pick<EditorDataState, "project" | "timelineZoom">;
  editorEnvironment: Pick<EditorEnvironment, "t" | "projectId">;
  editorSession: Pick<
    EditorSession,
    "onMinimizeWindow" | "onToggleMaximizeWindow" | "onCloseWindow" | "onBack"
  >;
}

export function useEditorHeaderView({
  editorDataState,
  editorEnvironment,
  editorSession,
}: Options) {
  const { project, timelineZoom } = editorDataState;
  const { t, projectId } = editorEnvironment;
  const { onMinimizeWindow, onToggleMaximizeWindow, onCloseWindow, onBack } =
    editorSession;
  return {
    projectName: project?.name ?? t("editor.project", { projectId }),
    savedLabel: t("editor.saved"),
    backLabel: t("editor.back"),
    zoomLabel: `${Math.round(timelineZoom * 100)}%`,
    minimizeWindowLabel: t("appLayout.window.minimize"),
    maximizeWindowLabel: t("appLayout.window.maximize"),
    closeWindowLabel: t("appLayout.window.close"),
    zoomResetLabel: t("editor.zoomReset"),
    aspectLabel: "16:9",
    onMinimizeWindow,
    onToggleMaximizeWindow,
    onCloseWindow,
    onBack,
  };
}

export type EditorHeaderView = ReturnType<typeof useEditorHeaderView>;
