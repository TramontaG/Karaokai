import { useEffect } from "react";
import { type SubtitleTrack } from "../../domain/project";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorSelection } from "./useEditorSelection";
import type { SubtitlePhraseActions } from "./useSubtitlePhraseActions";
import type { TimelineTempo } from "./useTimelineTempo";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    "exportLockRef" | "hoveredPhraseRef" | "projectRef"
  >;
  editorDataState: Pick<
    EditorDataState,
    | "trackPendingDeletionId"
    | "selectedPhraseId"
    | "selectedPhraseIds"
    | "selectedWordId"
  >;
  editorSelection: Pick<EditorSelection, "clearPhraseSelection">;
  subtitlePhraseActions: Pick<
    SubtitlePhraseActions,
    "onCopyPhrase" | "onPastePhrase" | "onSplitPhrase" | "onDeletePhrase"
  >;
  editorHistory: Pick<EditorHistory, "onUndo">;
  editorPlayback: Pick<EditorPlayback, "onTogglePlayback">;
  timelineTempo: Pick<TimelineTempo, "addTimelineMarker">;
}

export function useEditorShortcuts({
  editorRuntime,
  editorDataState,
  editorSelection,
  subtitlePhraseActions,
  editorHistory,
  editorPlayback,
  timelineTempo,
}: Options) {
  const { exportLockRef, hoveredPhraseRef, projectRef } = editorRuntime;
  const {
    trackPendingDeletionId,
    selectedPhraseId,
    selectedPhraseIds,
    selectedWordId,
  } = editorDataState;
  const { clearPhraseSelection } = editorSelection;
  const { onCopyPhrase, onPastePhrase, onSplitPhrase, onDeletePhrase } =
    subtitlePhraseActions;
  const { onUndo } = editorHistory;
  const { onTogglePlayback } = editorPlayback;
  const { addTimelineMarker } = timelineTempo;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (exportLockRef.current) {
        event.preventDefault();
        return;
      }
      if (trackPendingDeletionId !== null) return;
      const target = event.target as HTMLElement | null;
      const input = target?.closest("input");
      const isTextEditingTarget =
        target?.closest("textarea, [contenteditable='true']") ||
        (input &&
          ["text", "search", "email", "password", "tel", "url"].includes(
            input.type
          ));
      if (isTextEditingTarget) return;
      if (event.key === "Escape") {
        if (
          selectedPhraseId !== null ||
          selectedPhraseIds.length > 0 ||
          selectedWordId !== null
        ) {
          event.preventDefault();
          clearPhraseSelection();
        }
        return;
      }
      const commandKey = event.ctrlKey || event.metaKey;
      if (commandKey && !event.altKey && !event.shiftKey && !event.repeat) {
        const key = event.key.toLowerCase();
        const handled =
          (key === "c" && onCopyPhrase()) ||
          (key === "v" && onPastePhrase()) ||
          (key === "z" && onUndo());
        if (handled) {
          event.preventDefault();
          return;
        }
      }
      if (event.code === "Space" && !commandKey && !event.altKey) {
        event.preventDefault();
        if (!event.repeat) onTogglePlayback();
        return;
      }
      if (
        event.key.toLowerCase() === "m" &&
        !commandKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat
      ) {
        event.preventDefault();
        addTimelineMarker();
        return;
      }
      if (
        event.key.toLowerCase() === "s" &&
        !commandKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat
      ) {
        const hoveredPhrase = hoveredPhraseRef.current;
        const currentProject = projectRef.current;
        const track = currentProject?.tracks.find(
          (item): item is SubtitleTrack =>
            item.type === "subtitle" && item.id === hoveredPhrase?.trackId
        );
        const phrase = track?.phrases.find(
          (item) => item.id === hoveredPhrase?.phraseId
        );
        if (track && phrase && hoveredPhrase) {
          event.preventDefault();
          onSplitPhrase(track, phrase, hoveredPhrase.clientX);
        }
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        (selectedPhraseId !== null || selectedPhraseIds.length > 0)
      ) {
        event.preventDefault();
        onDeletePhrase();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    addTimelineMarker,
    clearPhraseSelection,
    onCopyPhrase,
    onDeletePhrase,
    onPastePhrase,
    onSplitPhrase,
    onTogglePlayback,
    onUndo,
    selectedPhraseId,
    selectedPhraseIds.length,
    selectedWordId,
    trackPendingDeletionId,
  ]);
  return {};
}

export type EditorShortcuts = ReturnType<typeof useEditorShortcuts>;
