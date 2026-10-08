import { useCallback, useState } from "react";
import {
  hasSubtitlePhraseTiming,
  type SubtitleWord,
} from "../../domain/project";
import { isDesktop } from "../../services/desktop";
import { alignProjectPhrase } from "../../services/projects";
import { replacePhrase } from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorRuntime: Pick<EditorRuntime, "projectRef">;
  editorDataState: Pick<
    EditorDataState,
    "selectedPhraseId" | "audioSources" | "setSelectedWordId"
  >;
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  editorEnvironment: Pick<EditorEnvironment, "projectId" | "data" | "t">;
  editorHistory: Pick<EditorHistory, "persistProject">;
}

const MAX_DISCARDED_PAUSE_MS = 100;

export function usePhraseFineAlignment({
  editorRuntime,
  editorDataState,
  editorProjectValues,
  editorEnvironment,
  editorHistory,
}: Options) {
  const { projectRef } = editorRuntime;
  const { selectedPhraseId, audioSources, setSelectedWordId } = editorDataState;
  const { subtitleTrack } = editorProjectValues;
  const { projectId, data, t } = editorEnvironment;
  const { persistProject } = editorHistory;
  const [aligningPhraseId, setAligningPhraseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPhraseId, setErrorPhraseId] = useState<string | null>(null);
  const [alignedPhraseId, setAlignedPhraseId] = useState<string | null>(null);

  const selectedPhrase =
    subtitleTrack?.phrases.find((phrase) => phrase.id === selectedPhraseId) ??
    null;
  const vocalsAvailable = Boolean(audioSources?.vocals);
  const canAlign =
    isDesktop() &&
    vocalsAvailable &&
    selectedPhrase !== null &&
    Boolean(selectedPhrase.text.trim()) &&
    hasSubtitlePhraseTiming(selectedPhrase) &&
    aligningPhraseId === null;

  const onFineAlign = useCallback(async () => {
    if (!canAlign || !selectedPhrase || !subtitleTrack) return;
    const source = {
      id: selectedPhrase.id,
      trackId: subtitleTrack.id,
      text: selectedPhrase.text,
      start: selectedPhrase.start,
      end: selectedPhrase.end,
      words: selectedPhrase.words,
    };
    setAligningPhraseId(source.id);
    setError(null);
    setErrorPhraseId(null);
    setAlignedPhraseId(null);
    try {
      const result = await alignProjectPhrase(
        projectId,
        {
          text: source.text,
          start: Math.round(source.start),
          end: Math.round(source.end),
        },
        data.preferences.storageDirectory
      );
      const currentProject = projectRef.current;
      const currentTrack = currentProject?.tracks.find(
        (track) => track.type === "subtitle" && track.id === source.trackId
      );
      const currentPhrase =
        currentTrack?.type === "subtitle"
          ? currentTrack.phrases.find((phrase) => phrase.id === source.id)
          : null;
      if (
        !currentProject ||
        !currentPhrase ||
        currentPhrase.text !== source.text ||
        currentPhrase.start !== source.start ||
        currentPhrase.end !== source.end ||
        currentPhrase.words !== source.words
      ) {
        throw new Error(t("editor.fineAlign.changed"));
      }
      const tokens = source.text.trim().split(/\s+/);
      if (
        result.words.length !== tokens.length ||
        result.words.some(
          (word) =>
            !Number.isFinite(word.start) ||
            !Number.isFinite(word.end) ||
            word.end <= word.start ||
            word.start < Math.max(0, source.start - 1000) ||
            word.end > source.end + 1000
        ) ||
        result.words.some(
          (word, index) =>
            index > 0 && word.start < result.words[index - 1].start
        )
      ) {
        throw new Error(t("editor.fineAlign.invalidResult"));
      }
      const oldWords = currentPhrase.words.filter(
        (word) => word.type !== "gap"
      );
      const words: SubtitleWord[] = result.words.map((word, index) => ({
        ...(oldWords[index] ?? { id: crypto.randomUUID() }),
        text: tokens[index],
        start: Math.round(word.start),
        end: Math.round(word.end),
      }));
      for (let index = 1; index < words.length; index += 1) {
        const previous = words[index - 1];
        const pause = words[index].start - previous.end;
        if (pause > 0 && pause <= MAX_DISCARDED_PAUSE_MS) {
          previous.end = words[index].start;
        }
      }
      persistProject(
        replacePhrase(currentProject, source.trackId, source.id, {
          ...currentPhrase,
          start: words[0].start,
          end: words[words.length - 1].end,
          words,
        }),
        true
      );
      setSelectedWordId(null);
      setAlignedPhraseId(source.id);
    } catch (reason) {
      setError(
        t("editor.fineAlign.error", {
          details: reason instanceof Error ? reason.message : String(reason),
        })
      );
      setErrorPhraseId(source.id);
    } finally {
      setAligningPhraseId(null);
    }
  }, [
    canAlign,
    data.preferences.storageDirectory,
    persistProject,
    projectId,
    projectRef,
    selectedPhrase,
    setSelectedWordId,
    subtitleTrack,
    t,
  ]);

  return {
    fineAlignSelected: selectedPhrase !== null,
    canFineAlign: canAlign,
    fineAlignBusy:
      aligningPhraseId !== null && aligningPhraseId === selectedPhraseId,
    fineAlignError: errorPhraseId === selectedPhraseId ? error : null,
    fineAlignSuccess:
      alignedPhraseId !== null && alignedPhraseId === selectedPhraseId,
    fineAlignVocalsAvailable: vocalsAvailable,
    onFineAlign,
  };
}

export type PhraseFineAlignment = ReturnType<typeof usePhraseFineAlignment>;
