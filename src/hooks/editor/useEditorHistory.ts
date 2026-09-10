import { useCallback } from "react";
import { type KaraokeProject } from "../../domain/project";
import { HISTORY_LIMIT } from "../../util/editor/constants";
import { snapshotProject } from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorProjectChanges } from "./useEditorProjectChanges";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    "projectRef" | "exportLockRef" | "selectionRef" | "historyRef"
  >;
  editorProjectChanges: Pick<EditorProjectChanges, "applyProject">;
  editorDataState: Pick<
    EditorDataState,
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "setSelectedPhraseIds"
    | "setPhraseSelectionAnchorId"
    | "setSelectedWordId"
  >;
}

export function useEditorHistory({
  editorRuntime,
  editorProjectChanges,
  editorDataState,
}: Options) {
  const { projectRef, exportLockRef, selectionRef, historyRef } = editorRuntime;
  const { applyProject } = editorProjectChanges;
  const {
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedWordId,
  } = editorDataState;
  const persistProject = useCallback(
    (
      next: KaraokeProject,
      immediate = false,
      historySource = projectRef.current
    ) => {
      if (exportLockRef.current) return;
      if (historySource && historySource !== next) {
        const selection = selectionRef.current;
        historyRef.current.push({
          // Keep a real snapshot: a later edit must never mutate the state that
          // Ctrl+Z is expected to restore.
          project: snapshotProject(historySource),
          selectedTrackId: selection.selectedTrackId,
          selectedPhraseId: selection.selectedPhraseId,
          selectedPhraseIds: selection.selectedPhraseIds,
          phraseSelectionAnchorId: selection.phraseSelectionAnchorId,
          selectedWordId: selection.selectedWordId,
        });
        if (historyRef.current.length > HISTORY_LIMIT) {
          historyRef.current.splice(
            0,
            historyRef.current.length - HISTORY_LIMIT
          );
        }
      }
      applyProject(next, immediate);
    },
    [applyProject]
  );

  const onUndo = useCallback(() => {
    const entry = historyRef.current.pop();
    if (!entry) return false;
    const restored = {
      ...snapshotProject(entry.project),
      updatedAt: String(Date.now()),
    };
    setSelectedTrackId(entry.selectedTrackId);
    setSelectedPhraseId(entry.selectedPhraseId);
    setSelectedPhraseIds(entry.selectedPhraseIds);
    setPhraseSelectionAnchorId(entry.phraseSelectionAnchorId);
    setSelectedWordId(entry.selectedWordId);
    applyProject(restored, true);
    return true;
  }, [applyProject, setPhraseSelectionAnchorId, setSelectedPhraseIds]);
  return { persistProject, onUndo };
}

export type EditorHistory = ReturnType<typeof useEditorHistory>;
