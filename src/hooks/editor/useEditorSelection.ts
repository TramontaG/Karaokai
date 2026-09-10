import { useCallback, type MouseEvent } from "react";
import {
  type SubtitlePhrase,
  type SubtitleTrack,
  type SubtitleWord,
} from "../../domain/project";
import { timeAtTimelinePosition } from "../../screens/EditorScreen/timeline";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorRuntime: Pick<EditorRuntime, "projectRef" | "timelineContentRef">;
  editorDataState: Pick<
    EditorDataState,
    | "selectedTrackId"
    | "phraseSelectionAnchorId"
    | "selectedPhraseIds"
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "setSelectedPhraseIds"
    | "setPhraseSelectionAnchorId"
    | "setSelectedWordId"
  >;
  editorPlayback: Pick<EditorPlayback, "onSeek">;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
}

export function useEditorSelection({
  editorRuntime,
  editorDataState,
  editorPlayback,
  editorProjectValues,
}: Options) {
  const { projectRef, timelineContentRef } = editorRuntime;
  const {
    selectedTrackId,
    phraseSelectionAnchorId,
    selectedPhraseIds,
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedWordId,
  } = editorDataState;
  const { onSeek } = editorPlayback;
  const { timelineDuration } = editorProjectValues;
  const onSelectPhrase = useCallback(
    (
      trackId: string,
      phrase: SubtitlePhrase,
      event?: Pick<MouseEvent<HTMLElement>, "ctrlKey" | "metaKey" | "shiftKey">
    ) => {
      const track = projectRef.current?.tracks.find(
        (item): item is SubtitleTrack =>
          item.type === "subtitle" && item.id === trackId
      );
      const commandKey = event?.ctrlKey || event?.metaKey;
      const anchorId =
        trackId === selectedTrackId ? phraseSelectionAnchorId : null;
      let nextIds: string[];
      if (event?.shiftKey && track && anchorId) {
        const anchorIndex = track.phrases.findIndex(
          (item) => item.id === anchorId
        );
        const phraseIndex = track.phrases.findIndex(
          (item) => item.id === phrase.id
        );
        nextIds =
          anchorIndex < 0 || phraseIndex < 0
            ? [phrase.id]
            : track.phrases
                .slice(
                  Math.min(anchorIndex, phraseIndex),
                  Math.max(anchorIndex, phraseIndex) + 1
                )
                .map((item) => item.id);
      } else if (commandKey && trackId === selectedTrackId) {
        nextIds = selectedPhraseIds.includes(phrase.id)
          ? selectedPhraseIds.filter((id) => id !== phrase.id)
          : [...selectedPhraseIds, phrase.id];
      } else {
        nextIds = [phrase.id];
      }
      setSelectedTrackId(trackId);
      setSelectedPhraseId(
        nextIds.includes(phrase.id) ? phrase.id : (nextIds.at(-1) ?? null)
      );
      setSelectedPhraseIds(nextIds);
      if (!event?.shiftKey && !commandKey)
        setPhraseSelectionAnchorId(phrase.id);
      else if (!anchorId && nextIds.length)
        setPhraseSelectionAnchorId(phrase.id);
      setSelectedWordId(null);
    },
    [
      setSelectedPhraseId,
      setSelectedPhraseIds,
      setPhraseSelectionAnchorId,
      setSelectedTrackId,
      setSelectedWordId,
      phraseSelectionAnchorId,
      selectedPhraseIds,
      selectedTrackId,
    ]
  );

  const onSelectWord = useCallback(
    (
      trackId: string,
      phrase: SubtitlePhrase,
      word: SubtitleWord,
      clientX?: number
    ) => {
      setSelectedTrackId(trackId);
      setSelectedPhraseId(phrase.id);
      setSelectedPhraseIds([phrase.id]);
      setPhraseSelectionAnchorId(phrase.id);
      setSelectedWordId(word.id);
      if (clientX === undefined) return;
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      if (!bounds) return;
      onSeek(
        timeAtTimelinePosition(
          clientX,
          bounds.left,
          bounds.width,
          timelineDuration
        )
      );
    },
    [
      onSeek,
      setPhraseSelectionAnchorId,
      setSelectedPhraseId,
      setSelectedPhraseIds,
      setSelectedTrackId,
      setSelectedWordId,
      timelineDuration,
    ]
  );

  const clearPhraseSelection = useCallback(() => {
    setSelectedPhraseId(null);
    setSelectedPhraseIds([]);
    setPhraseSelectionAnchorId(null);
    setSelectedWordId(null);
  }, [setPhraseSelectionAnchorId, setSelectedPhraseIds]);
  return { clearPhraseSelection, onSelectPhrase, onSelectWord };
}

export type EditorSelection = ReturnType<typeof useEditorSelection>;
