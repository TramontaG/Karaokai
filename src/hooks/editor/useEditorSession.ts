import { useCallback, useEffect } from "react";
import { isDesktop, listenDesktop, windowAction } from "../../services/desktop";
import { loadProject, saveProject } from "../../services/projects";
import {
  registerBeforeWindowClose,
  saveProjectBeforeWindowClose,
} from "../../services/projectWindowLifecycle";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectChanges } from "./useEditorProjectChanges";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorEnvironment: Pick<
    EditorEnvironment,
    "projectId" | "data" | "setAppData" | "navigate"
  >;
  editorProjectChanges: Pick<
    EditorProjectChanges,
    "setLiveProject" | "saveProjectNow"
  >;
  editorDataState: Pick<EditorDataState, "setError" | "project">;
  editorRuntime: Pick<
    EditorRuntime,
    | "historyRef"
    | "phraseClipboardRef"
    | "errorTimerRef"
    | "saveTimerRef"
    | "projectRef"
    | "exportLockRef"
    | "thumbnailCaptureRef"
    | "closingWindowRef"
  >;
}

export function useEditorSession({
  editorEnvironment,
  editorProjectChanges,
  editorDataState,
  editorRuntime,
}: Options) {
  const { projectId, data, setAppData, navigate } = editorEnvironment;
  const { setLiveProject, saveProjectNow } = editorProjectChanges;
  const { setError, project } = editorDataState;
  const {
    historyRef,
    phraseClipboardRef,
    errorTimerRef,
    saveTimerRef,
    projectRef,
    exportLockRef,
    thumbnailCaptureRef,
    closingWindowRef,
  } = editorRuntime;
  const refresh = useCallback(async () => {
    try {
      const loaded = await loadProject(
        projectId,
        data.preferences.storageDirectory
      );
      if (loaded) {
        const normalized = setLiveProject(loaded);
        if (
          normalized.thumbnail !== loaded.thumbnail ||
          JSON.stringify(normalized.tracks) !== JSON.stringify(loaded.tracks)
        )
          saveProjectNow(normalized);
        setAppData({ currentProject: { id: loaded.id, name: loaded.name } });
      }
    } catch (reason) {
      setError(String(reason));
    }
  }, [
    data.preferences.storageDirectory,
    projectId,
    setAppData,
    setLiveProject,
  ]);

  useEffect(() => {
    historyRef.current = [];
    phraseClipboardRef.current = [];
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(
    () => () => {
      if (errorTimerRef.current !== null)
        window.clearTimeout(errorTimerRef.current);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (projectRef.current && !exportLockRef.current)
        saveProjectNow(projectRef.current);
    },
    [saveProjectNow]
  );

  const saveBeforeWindowClose = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await thumbnailCaptureRef.current?.();
    if (!projectRef.current) return;
    try {
      await saveProject(projectRef.current, data.preferences.storageDirectory);
    } catch (reason) {
      setError(String(reason));
      throw reason;
    }
  }, [data.preferences.storageDirectory]);

  useEffect(
    () => registerBeforeWindowClose(saveBeforeWindowClose),
    [saveBeforeWindowClose]
  );

  const onMinimizeWindow = useCallback(() => {
    void windowAction("minimize");
  }, []);

  const onToggleMaximizeWindow = useCallback(() => {
    void windowAction("maximize");
  }, []);

  const onCloseWindow = useCallback(async () => {
    if (closingWindowRef.current) return;
    closingWindowRef.current = true;
    try {
      await saveBeforeWindowClose();
      await windowAction("close");
    } finally {
      closingWindowRef.current = false;
    }
  }, [saveBeforeWindowClose]);

  useEffect(() => {
    if (
      !project?.processing.some(
        (stage) => stage.status === "pending" || stage.status === "running"
      )
    )
      return;
    let disposed = false;
    void (async () => {
      await saveProjectBeforeWindowClose();
      if (disposed) return;
      await navigate({
        to: "/projects/$projectId/preparing",
        params: { projectId },
      });
    })();
    return () => {
      disposed = true;
    };
  }, [navigate, project, projectId]);

  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;
    void listenDesktop<{ projectId: string }>(
      "project-processing-progress",
      (event) => {
        if (event.payload.projectId === projectId) void refresh();
      }
    ).then((stop) => {
      unlisten = stop;
    });
    return () => unlisten?.();
  }, [projectId, refresh]);

  const onBack = useCallback(
    () =>
      void (async () => {
        await thumbnailCaptureRef.current?.();
        await navigate({ to: "/library" });
      })(),
    [navigate]
  );
  return { onMinimizeWindow, onToggleMaximizeWindow, onCloseWindow, onBack };
}

export type EditorSession = ReturnType<typeof useEditorSession>;
