import { useMemo } from "react";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";

interface Options {
  editorEnvironment: Pick<EditorEnvironment, "data" | "t">;
  editorDataState: Pick<
    EditorDataState,
    | "inspectorTab"
    | "phraseScaleInputValue"
    | "project"
    | "selectedPhraseId"
    | "selectedTrackId"
    | "selectedWordId"
    | "trackPendingDeletionId"
    | "trackScaleInputValue"
    | "wordScaleInputValue"
  >;
}

export function useEditorRenderKeys({
  editorEnvironment,
  editorDataState,
}: Options) {
  const { data, t } = editorEnvironment;
  const {
    inspectorTab,
    phraseScaleInputValue,
    project,
    selectedPhraseId,
    selectedTrackId,
    selectedWordId,
    trackPendingDeletionId,
    trackScaleInputValue,
    wordScaleInputValue,
  } = editorDataState;
  const sidebarRenderKey = useMemo(
    () => ({}),
    [
      data.preferences.storageDirectory,
      inspectorTab,
      phraseScaleInputValue,
      project,
      selectedPhraseId,
      selectedTrackId,
      selectedWordId,
      t,
      trackPendingDeletionId,
      trackScaleInputValue,
      wordScaleInputValue,
    ]
  );

  const headerRenderKey = useMemo(() => ({}), [project?.name, t]);
  return { sidebarRenderKey, headerRenderKey };
}

export type EditorRenderKeys = ReturnType<typeof useEditorRenderKeys>;
