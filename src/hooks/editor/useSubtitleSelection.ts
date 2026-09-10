import { useMemo } from "react";
import { type SubtitleAnimationTemplate } from "../../domain/project";
import { subtitlePreviewView } from "../../util/editor/subtitlePreview";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorProjectValues } from "./useEditorProjectValues";

interface Options {
  editorProjectValues: Pick<
    EditorProjectValues,
    "subtitleTrack" | "subtitleTracks"
  >;
  editorDataState: Pick<
    EditorDataState,
    "currentTime" | "selectedPhraseId" | "selectedWordId"
  >;
}

export function useSubtitleSelection({
  editorProjectValues,
  editorDataState,
}: Options) {
  const { subtitleTrack, subtitleTracks } = editorProjectValues;
  const { currentTime, selectedPhraseId, selectedWordId } = editorDataState;
  const animationTemplate: SubtitleAnimationTemplate =
    subtitleTrack?.animation?.template ?? "template-1";

  const subtitlePreviews = useMemo(
    () =>
      subtitleTracks.map((track) => subtitlePreviewView(track, currentTime)),
    [currentTime, subtitleTracks]
  );

  const selectedSubtitlePreview =
    subtitlePreviews.find((preview) => preview.id === subtitleTrack?.id) ??
    null;

  const playingPhrase = selectedSubtitlePreview?.playingPhrase ?? null;

  const selectedPhrase =
    subtitleTrack?.phrases.find((phrase) => phrase.id === selectedPhraseId) ??
    null;

  const activePhrase = selectedPhrase ?? playingPhrase;

  const playbackWord =
    playingPhrase?.words.find(
      (word) => currentTime >= word.start && currentTime <= word.end
    ) ?? null;

  const playbackWordId = playbackWord?.id ?? null;

  const selectedWord =
    activePhrase?.words.find((word) => word.id === selectedWordId) ?? null;
  return {
    activePhrase,
    selectedWord,
    subtitlePreviews,
    playbackWordId,
    animationTemplate,
  };
}

export type SubtitleSelection = ReturnType<typeof useSubtitleSelection>;
