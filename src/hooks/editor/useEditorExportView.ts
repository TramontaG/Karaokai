import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorExport } from "./useEditorExport";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorEnvironment: Pick<EditorEnvironment, "t">;
  editorTransientState: Pick<
    EditorTransientState,
    | "exportDialogOpen"
    | "exportResolution"
    | "exportFps"
    | "exportAudioMode"
    | "exportInstrumentalVolume"
    | "exportVocalsVolume"
    | "exportEncodingPreset"
    | "renderProgress"
    | "isCancellingExport"
    | "setExportDialogOpen"
    | "setExportResolution"
    | "setExportFps"
    | "setExportAudioMode"
    | "setExportInstrumentalVolume"
    | "setExportVocalsVolume"
    | "setExportEncodingPreset"
  >;
  editorExport: Pick<
    EditorExport,
    | "renderProgressTitle"
    | "renderProgressIcon"
    | "onOpenExport"
    | "onStartExport"
    | "onCancelExport"
  >;
}

export function useEditorExportView({
  editorEnvironment,
  editorTransientState,
  editorExport,
}: Options) {
  const { t } = editorEnvironment;
  const {
    exportDialogOpen,
    exportResolution,
    exportFps,
    exportAudioMode,
    exportInstrumentalVolume,
    exportVocalsVolume,
    exportEncodingPreset,
    renderProgress,
    isCancellingExport,
    setExportDialogOpen,
    setExportResolution,
    setExportFps,
    setExportAudioMode,
    setExportInstrumentalVolume,
    setExportVocalsVolume,
    setExportEncodingPreset,
  } = editorTransientState;
  const {
    renderProgressTitle,
    renderProgressIcon,
    onOpenExport,
    onStartExport,
    onCancelExport,
  } = editorExport;
  return {
    exportLabel: t("editor.export"),
    exportDialogOpen,
    exportResolution,
    exportFps,
    exportAudioMode,
    exportInstrumentalVolume,
    exportVocalsVolume,
    exportEncodingPreset,
    renderProgress,
    isCancellingExport,
    renderProgressTitle,
    renderProgressIcon,
    exportTitle: t("editor.exportTitle"),
    exportDescription: t("editor.exportDescription"),
    exportAdvancedOptionsLabel: t("editor.exportAdvancedOptions"),
    exportResolutionLabel: t("editor.exportResolution"),
    exportFpsLabel: t("editor.exportFps"),
    exportAudioLabel: t("editor.exportAudio"),
    exportEncodingPresetLabel: t("editor.exportEncodingPreset"),
    exportEncodingPresetNotice: t("editor.exportEncodingPresetNotice"),
    exportMixLabel: t("editor.exportMix"),
    exportVocalsOnlyLabel: t("editor.exportVocalsOnly"),
    exportInstrumentalOnlyLabel: t("editor.exportInstrumentalOnly"),
    exportCancelLabel: t("editor.exportCancel"),
    exportConfirmLabel: t("editor.exportConfirm"),
    exportCloseLabel: t("editor.exportClose"),
    exportRenderingLabel: t("editor.exportRendering"),
    exportCompletedLabel: t("editor.exportCompleted"),
    exportFailedLabel: t("editor.exportFailed"),
    onOpenExport,
    onStartExport,
    onCloseExportDialog: () => setExportDialogOpen(false),
    onExportResolutionChange: setExportResolution,
    onExportFpsChange: setExportFps,
    onExportAudioModeChange: setExportAudioMode,
    onExportInstrumentalVolumeChange: setExportInstrumentalVolume,
    onExportVocalsVolumeChange: setExportVocalsVolume,
    onExportEncodingPresetChange: setExportEncodingPreset,
    onCancelExport,
  };
}

export type EditorExportView = ReturnType<typeof useEditorExportView>;
