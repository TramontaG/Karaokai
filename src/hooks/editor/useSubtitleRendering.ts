import { createElement, useCallback } from "react";
import { type SubtitleWord } from "../../domain/project";
import {
  CurrentPhrase,
  EntryCue,
  EntryCueBar,
  EntryCueBarFill,
  NextPhrase,
  PreviewWord,
  PreviewWordFill,
  SubtitlePreview,
  WordRow,
} from "../../screens/EditorScreen/styles";
import { formatTime } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorSelection } from "./useEditorSelection";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  subtitleSelection: Pick<
    SubtitleSelection,
    "subtitlePreviews" | "playbackWordId" | "activePhrase"
  >;
  editorDataState: Pick<EditorDataState, "selectedWordId">;
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  editorSelection: Pick<EditorSelection, "onSelectWord">;
}

export function useSubtitleRendering({
  subtitleSelection,
  editorDataState,
  editorProjectValues,
  editorSelection,
}: Options) {
  const { subtitlePreviews, playbackWordId, activePhrase } = subtitleSelection;
  const { selectedWordId } = editorDataState;
  const { subtitleTrack } = editorProjectValues;
  const { onSelectWord } = editorSelection;
  const renderSubtitlePreview = useCallback(
    (preview: (typeof subtitlePreviews)[number]) => {
      if (!preview.visible) return null;
      const renderEntryCue = (phraseId: string | undefined) =>
        preview.showEntryCue && preview.entryCuePhrase?.id === phraseId
          ? createElement(
              EntryCue,
              { style: preview.entryCueStyle },
              createElement(
                EntryCueBar,
                undefined,
                createElement(EntryCueBarFill)
              )
            )
          : null;
      return createElement(
        SubtitlePreview,
        { style: preview.containerStyle },
        preview.words.length > 0
          ? createElement(
              CurrentPhrase,
              { style: preview.currentStyle },
              ...preview.words.map((word) =>
                createElement(
                  PreviewWord,
                  {
                    key: word.id,
                    $unreadColor: word.unreadColor,
                    $scale: word.scale,
                    $fontFamily: word.fontFamily,
                    $fontWeight: word.fontWeight,
                    $fontStyle: word.fontStyle,
                    $textDecoration: word.textDecoration,
                    $verticalAlign: word.verticalAlign,
                    $offsetX: word.offsetX,
                    $offsetY: word.offsetY,
                    "data-subtitle-track-id": preview.id,
                    "data-subtitle-phrase-id":
                      preview.timing.primaryPhrase?.id ?? "",
                    "data-subtitle-word-id": word.id,
                    "data-subtitle-color": "unreadColor",
                    "data-subtitle-color-source": word.unreadColorSource,
                  },
                  word.text,
                  createElement(
                    PreviewWordFill,
                    {
                      $progress: word.progress,
                      $readColor: word.readColor,
                      "data-subtitle-track-id": preview.id,
                      "data-subtitle-phrase-id":
                        preview.timing.primaryPhrase?.id ?? "",
                      "data-subtitle-word-id": word.id,
                      "data-subtitle-color": "readColor",
                      "data-subtitle-color-source": word.readColorSource,
                    },
                    word.text
                  )
                )
              ),
              renderEntryCue(preview.timing.primaryPhrase?.id)
            )
          : null,
        preview.timing.secondaryPhrase
          ? createElement(
              NextPhrase,
              { style: preview.nextPhraseStyle },
              ...(preview.secondaryWords.length > 0
                ? [
                    ...preview.secondaryWords.map((word) =>
                      createElement(
                        PreviewWord,
                        {
                          key: word.id,
                          $unreadColor: word.unreadColor,
                          $scale: word.scale,
                          $fontFamily: word.fontFamily,
                          $fontWeight: word.fontWeight,
                          $fontStyle: word.fontStyle,
                          $textDecoration: word.textDecoration,
                          $verticalAlign: word.verticalAlign,
                          $offsetX: word.offsetX,
                          $offsetY: word.offsetY,
                          "data-subtitle-track-id": preview.id,
                          "data-subtitle-phrase-id":
                            preview.timing.secondaryPhrase?.id ?? "",
                          "data-subtitle-word-id": word.id,
                          "data-subtitle-color": "unreadColor",
                          "data-subtitle-color-source": word.unreadColorSource,
                        },
                        word.text,
                        createElement(
                          PreviewWordFill,
                          {
                            $progress: word.progress,
                            $readColor: word.readColor,
                            "data-subtitle-track-id": preview.id,
                            "data-subtitle-phrase-id":
                              preview.timing.secondaryPhrase?.id ?? "",
                            "data-subtitle-word-id": word.id,
                            "data-subtitle-color": "readColor",
                            "data-subtitle-color-source": word.readColorSource,
                          },
                          word.text
                        )
                      )
                    ),
                    renderEntryCue(preview.timing.secondaryPhrase.id),
                  ]
                : [
                    preview.timing.secondaryPhrase.text,
                    renderEntryCue(preview.timing.secondaryPhrase.id),
                  ])
            )
          : null
      );
    },
    []
  );

  const renderWord = useCallback(
    (word: SubtitleWord) =>
      createElement(
        WordRow,
        {
          type: "button",
          $active: word.id === selectedWordId || word.id === playbackWordId,
          onClick: () =>
            subtitleTrack &&
            activePhrase &&
            onSelectWord(subtitleTrack.id, activePhrase, word),
        },
        createElement("span", undefined, word.text),
        createElement(
          "span",
          undefined,
          `${formatTime(word.start).slice(3)} – ${formatTime(word.end).slice(3)}`
        )
      ),
    [activePhrase, onSelectWord, playbackWordId, selectedWordId, subtitleTrack]
  );
  return { renderWord, renderSubtitlePreview };
}

export type SubtitleRendering = ReturnType<typeof useSubtitleRendering>;
