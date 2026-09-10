import { useCallback } from "react";
import {
  insertGapAfterWord,
  removePhraseWord,
  replacePhraseWordText,
  wordsForText,
} from "../../screens/EditorScreen/timeline";
import { replacePhrase } from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";
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
  subtitleSelection: Pick<SubtitleSelection, "activePhrase">;
  editorDataState: Pick<
    EditorDataState,
    "setSelectedWordId" | "selectedWordId"
  >;
  editorHistory: Pick<EditorHistory, "persistProject">;
}

export function useSubtitleTextEditing({
  editorRuntime,
  editorProjectValues,
  subtitleSelection,
  editorDataState,
  editorHistory,
}: Options) {
  const { projectRef } = editorRuntime;
  const { subtitleTrack, timelineDuration } = editorProjectValues;
  const { activePhrase } = subtitleSelection;
  const { setSelectedWordId, selectedWordId } = editorDataState;
  const { persistProject } = editorHistory;
  const onUpdatePhraseText = useCallback(
    (text: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = {
        ...activePhrase,
        text,
        words: wordsForText(activePhrase, text),
      };
      setSelectedWordId(phrase.words[0]?.id ?? null);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack]
  );

  const onUpdateInspectorWordText = useCallback(
    (wordId: string, text: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = replacePhraseWordText(activePhrase, wordId, text);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack]
  );

  const onInsertInspectorGap = useCallback(
    (wordId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = insertGapAfterWord(activePhrase, wordId, timelineDuration);
      if (phrase === activePhrase) return;
      const previousIds = new Set(activePhrase.words.map((word) => word.id));
      const gap = phrase.words.find(
        (word) => word.type === "gap" && !previousIds.has(word.id)
      );
      setSelectedWordId(gap?.id ?? null);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );

  const onDeleteInspectorWord = useCallback(
    (wordId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = removePhraseWord(activePhrase, wordId);
      const nextSelectedWord = phrase.words.find((word) => word.type !== "gap");
      setSelectedWordId(
        selectedWordId === wordId
          ? (nextSelectedWord?.id ?? null)
          : selectedWordId
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, selectedWordId, subtitleTrack]
  );
  return {
    onUpdatePhraseText,
    onUpdateInspectorWordText,
    onInsertInspectorGap,
    onDeleteInspectorWord,
  };
}

export type SubtitleTextEditing = ReturnType<typeof useSubtitleTextEditing>;
