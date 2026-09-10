import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  chooseVideoDestination,
  isDesktop,
  listenDesktop,
} from "../../services/desktop";
import {
  cancelProjectRender,
  saveProject,
  startProjectRender,
  type ProjectRenderProgress,
} from "../../services/projects";
import { isAudioTrack } from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorEnvironment: Pick<
    EditorEnvironment,
    "data" | "projectId" | "setAppData" | "t"
  >;
  editorDataState: Pick<EditorDataState, "project" | "setError">;
  editorTransientState: Pick<
    EditorTransientState,
    | "setExportDialogOpen"
    | "setIsCancellingExport"
    | "setRenderProgress"
    | "setExportInstrumentalVolume"
    | "setExportVocalsVolume"
    | "setExportAudioMode"
    | "exportResolution"
    | "exportAudioMode"
    | "exportInstrumentalVolume"
    | "exportVocalsVolume"
    | "exportFps"
    | "exportEncodingPreset"
    | "renderProgress"
    | "isCancellingExport"
  >;
  editorRuntime: Pick<
    EditorRuntime,
    "renderJobIdRef" | "exportLockRef" | "projectRef" | "saveTimerRef"
  >;
}

export function useEditorExport({
  editorEnvironment,
  editorDataState,
  editorTransientState,
  editorRuntime,
}: Options) {
  const { data, projectId, setAppData, t } = editorEnvironment;
  const { project, setError } = editorDataState;
  const {
    setExportDialogOpen,
    setIsCancellingExport,
    setRenderProgress,
    setExportInstrumentalVolume,
    setExportVocalsVolume,
    setExportAudioMode,
    exportResolution,
    exportAudioMode,
    exportInstrumentalVolume,
    exportVocalsVolume,
    exportFps,
    exportEncodingPreset,
    renderProgress,
    isCancellingExport,
  } = editorTransientState;
  const { renderJobIdRef, exportLockRef, projectRef, saveTimerRef } =
    editorRuntime;
  useEffect(() => {
    if (
      data.requestedEditorAction?.projectId !== projectId ||
      data.requestedEditorAction.action !== "export" ||
      !project
    )
      return;
    setExportDialogOpen(true);
    setAppData({ requestedEditorAction: null });
  }, [data.requestedEditorAction, project, projectId, setAppData]);

  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;
    void listenDesktop<ProjectRenderProgress>(
      "project-render-progress",
      (event) => {
        if (event.payload.jobId !== renderJobIdRef.current) return;
        if (event.payload.status !== "rendering") {
          exportLockRef.current = false;
          renderJobIdRef.current = null;
          setIsCancellingExport(false);
        }
        setRenderProgress((current) =>
          current?.jobId === event.payload.jobId
            ? {
                ...current,
                status: event.payload.status,
                progress: event.payload.progress ?? current.progress,
                outputPath: event.payload.outputPath ?? current.outputPath,
                error: event.payload.error ?? current.error,
              }
            : current
        );
      }
    ).then((stop) => {
      unlisten = stop;
    });
    return () => unlisten?.();
  }, []);

  const onOpenExport = useCallback(() => {
    if (exportLockRef.current) return;
    const audio = projectRef.current?.tracks.find(isAudioTrack);
    const instrumental = audio?.volume ?? 1;
    const vocals = audio?.vocalsVolume ?? 0;
    setExportInstrumentalVolume(instrumental);
    setExportVocalsVolume(vocals);
    setExportAudioMode("instrumental");
    setExportDialogOpen(true);
  }, []);

  const onStartExport = useCallback(async () => {
    const currentProject = projectRef.current;
    if (!currentProject || !isDesktop()) return;
    const selectedOutputPath = await chooseVideoDestination(
      `${currentProject.name}.mp4`
    );
    if (!selectedOutputPath) return;
    const outputPath = selectedOutputPath.toLowerCase().endsWith(".mp4")
      ? selectedOutputPath
      : `${selectedOutputPath}.mp4`;
    const resolution = {
      "480p": [854, 480],
      "720p": [1280, 720],
      "1080p": [1920, 1080],
      "1440p": [2560, 1440],
    } as const;
    const [width, height] = resolution[exportResolution];
    const instrumentalVolume =
      exportAudioMode === "vocals" ? 0 : exportInstrumentalVolume;
    const vocalsVolume =
      exportAudioMode === "instrumental" ? 0 : exportVocalsVolume;
    try {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      await saveProject(currentProject, data.preferences.storageDirectory);
      const jobId = await startProjectRender({
        projectId,
        storageDirectory: data.preferences.storageDirectory,
        outputPath,
        width,
        height,
        fps: exportFps,
        instrumentalVolume,
        vocalsVolume,
        encodingPreset: exportEncodingPreset,
      });
      exportLockRef.current = true;
      renderJobIdRef.current = jobId;
      setExportDialogOpen(false);
      setRenderProgress({ jobId, status: "rendering", progress: 0 });
    } catch (reason) {
      setError(String(reason));
    }
  }, [
    data.preferences.storageDirectory,
    exportAudioMode,
    exportFps,
    exportInstrumentalVolume,
    exportResolution,
    exportVocalsVolume,
    exportEncodingPreset,
    projectId,
  ]);

  const onCancelExport = useCallback(async () => {
    if (!renderProgress) return;
    if (renderProgress.status !== "rendering") {
      exportLockRef.current = false;
      renderJobIdRef.current = null;
      setRenderProgress(null);
      return;
    }
    if (isCancellingExport) return;

    setIsCancellingExport(true);
    try {
      await cancelProjectRender(renderProgress.jobId);
      exportLockRef.current = false;
      renderJobIdRef.current = null;
      setRenderProgress(null);
    } catch (reason) {
      setError(String(reason));
      setRenderProgress((current) =>
        current?.jobId === renderProgress.jobId
          ? { ...current, error: String(reason) }
          : current
      );
    } finally {
      setIsCancellingExport(false);
    }
  }, [isCancellingExport, renderProgress, setError]);

  const renderProgressTitle =
    renderProgress?.status === "completed"
      ? t("editor.exportCompleted")
      : renderProgress?.status === "failed"
        ? t("editor.exportFailed")
        : t("editor.exportRendering");

  const renderProgressIcon =
    renderProgress?.status === "completed"
      ? CheckCircle2
      : renderProgress?.status === "failed"
        ? AlertTriangle
        : LoaderCircle;
  return {
    renderProgressTitle,
    renderProgressIcon,
    onOpenExport,
    onStartExport,
    onCancelExport,
  };
}

export type EditorExport = ReturnType<typeof useEditorExport>;
