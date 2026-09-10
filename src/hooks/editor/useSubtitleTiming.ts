import { useCallback } from "react";
import {
  resizePhraseEnd,
  resizePhraseStart,
  resizeWordBoundary,
} from "../../screens/EditorScreen/timeline";
import { replacePhrase } from "../../util/editor/projectEditing";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorRuntime: Pick<EditorRuntime, "projectRef">;
  editorProjectValues: Pick<
    EditorProjectValues,
    "subtitleTrack" | "timelineDuration"
  >;
  subtitleSelection: Pick<SubtitleSelection, "activePhrase" | "selectedWord">;
  editorHistory: Pick<EditorHistory, "persistProject">;
}

export function useSubtitleTiming({
  editorRuntime,
  editorProjectValues,
  subtitleSelection,
  editorHistory,
}: Options) {
  const { projectRef } = editorRuntime;
  const { subtitleTrack, timelineDuration } = editorProjectValues;
  const { activePhrase, selectedWord } = subtitleSelection;
  const { persistProject } = editorHistory;
  const updatePhraseTime = useCallback(
    (edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase =
        edge === "start"
          ? resizePhraseStart(activePhrase, value)
          : resizePhraseEnd(activePhrase, value, timelineDuration);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );

  const updateWordTime = useCallback(
    (edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase || !selectedWord)
        return;
      const phrase = resizeWordBoundary(
        activePhrase,
        selectedWord.id,
        edge,
        value,
        timelineDuration
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [
      activePhrase,
      persistProject,
      selectedWord,
      subtitleTrack,
      timelineDuration,
    ]
  );

  const updateInspectorWordTime = useCallback(
    (wordId: string, edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = resizeWordBoundary(
        activePhrase,
        wordId,
        edge,
        value,
        timelineDuration
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );
  return { updatePhraseTime, updateWordTime, updateInspectorWordTime };
}

export type SubtitleTiming = ReturnType<typeof useSubtitleTiming>;
