import { handleEditorInputKeyDown } from "../../util/editor/inputShortcuts";
import { useEffect } from "react";
import { type SubtitleTrack } from "../../domain/project";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorSelection } from "./useEditorSelection";
import type { SubtitlePhraseActions } from "./useSubtitlePhraseActions";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    "exportLockRef" | "hoveredPhraseRef" | "projectRef" | "currentTimeRef"
  >;
  editorDataState: Pick<
    EditorDataState,
    | "trackPendingDeletionId"
    | "selectedPhraseId"
    | "selectedPhraseIds"
    | "selectedWordId"
    | "timelineTool"
    | "setTimelineTool"
  >;
  editorSelection: Pick<EditorSelection, "clearPhraseSelection">;
  subtitlePhraseActions: Pick<
    SubtitlePhraseActions,
    | "onCopyPhrase"
    | "onPastePhrase"
    | "onSplitPhrase"
    | "onDeletePhrase"
    | "onJoinPhrases"
  >;
  editorHistory: Pick<EditorHistory, "onUndo" | "onRedo">;
  editorPlayback: Pick<EditorPlayback, "onTogglePlayback" | "onSeek">;
}

export function useEditorShortcuts({
  editorRuntime,
  editorDataState,
  editorSelection,
  subtitlePhraseActions,
  editorHistory,
  editorPlayback,
}: Options) {
  const { exportLockRef, hoveredPhraseRef, projectRef, currentTimeRef } =
    editorRuntime;
  const {
    trackPendingDeletionId,
    selectedPhraseId,
    selectedPhraseIds,
    selectedWordId,
    timelineTool,
    setTimelineTool,
  } = editorDataState;
  const { clearPhraseSelection } = editorSelection;
  const {
    onCopyPhrase,
    onPastePhrase,
    onSplitPhrase,
    onDeletePhrase,
    onJoinPhrases,
  } = subtitlePhraseActions;
  const { onUndo, onRedo } = editorHistory;
  const { onTogglePlayback, onSeek } = editorPlayback;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (exportLockRef.current) {
        event.preventDefault();
        return;
      }
      if (trackPendingDeletionId !== null) return;
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229)
        return;
      if (handleEditorInputKeyDown(event)) return;
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
      if (!commandKey && !event.altKey && !event.shiftKey) {
        const duration = projectRef.current?.duration;
        const seekTarget =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? duration
              : event.key === "PageUp"
                ? currentTimeRef.current + 15_000
                : event.key === "PageDown"
                  ? currentTimeRef.current - 15_000
                  : undefined;
        if (duration !== undefined && seekTarget !== undefined) {
          event.preventDefault();
          onSeek(Math.max(0, Math.min(duration, seekTarget)));
          return;
        }
      }
      if (
        commandKey &&
        !event.altKey &&
        !event.repeat &&
        ((event.shiftKey && event.key.toLowerCase() === "z") ||
          (!event.shiftKey && event.key.toLowerCase() === "y"))
      ) {
        if (onRedo()) event.preventDefault();
        return;
      }
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
        setTimelineTool(timelineTool === "marker" ? "pointer" : "marker");
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
        event.key.toLowerCase() === "j" &&
        !commandKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat
      ) {
        if (onJoinPhrases()) event.preventDefault();
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
    clearPhraseSelection,
    onCopyPhrase,
    onDeletePhrase,
    onPastePhrase,
    onJoinPhrases,
    onSplitPhrase,
    onTogglePlayback,
    onSeek,
    onUndo,
    onRedo,
    selectedPhraseId,
    selectedPhraseIds.length,
    selectedWordId,
    trackPendingDeletionId,
    timelineTool,
    setTimelineTool,
  ]);
  return {};
}

export type EditorShortcuts = ReturnType<typeof useEditorShortcuts>;
