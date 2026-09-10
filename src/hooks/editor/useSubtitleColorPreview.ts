import { useCallback } from "react";
import { type SubtitlePropertyScope } from "../../util/editor/types";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorRuntime: Pick<EditorRuntime, "liveColorElementsRef" | "previewCanvas">;
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  subtitleSelection: Pick<SubtitleSelection, "activePhrase" | "selectedWord">;
}

export function useSubtitleColorPreview({
  editorRuntime,
  editorProjectValues,
  subtitleSelection,
}: Options) {
  const { liveColorElementsRef, previewCanvas } = editorRuntime;
  const { subtitleTrack } = editorProjectValues;
  const { activePhrase, selectedWord } = subtitleSelection;
  const clearColorPreview = useCallback(() => {
    liveColorElementsRef.current.forEach((element) => {
      element.style.removeProperty("color");
    });
    liveColorElementsRef.current = [];
  }, []);

  const onPreviewScopedColor = useCallback(
    (
      scope: SubtitlePropertyScope,
      property: "unreadColor" | "readColor",
      value: string
    ) => {
      if (!subtitleTrack) return;
      if (scope !== "track" && !activePhrase) return;
      if (scope === "word" && !selectedWord) return;

      clearColorPreview();
      const elements = previewCanvas.current?.querySelectorAll<HTMLElement>(
        "[data-subtitle-color]"
      );
      if (!elements) return;

      elements.forEach((element) => {
        if (
          element.dataset.subtitleColor !== property ||
          element.dataset.subtitleTrackId !== subtitleTrack.id
        ) {
          return;
        }
        const matchesScope =
          scope === "track"
            ? element.dataset.subtitleColorSource === "track"
            : scope === "phrase"
              ? element.dataset.subtitlePhraseId === activePhrase?.id &&
                element.dataset.subtitleColorSource === "phrase"
              : element.dataset.subtitlePhraseId === activePhrase?.id &&
                element.dataset.subtitleWordId === selectedWord?.id;
        if (!matchesScope) return;
        element.style.color = value;
        liveColorElementsRef.current.push(element);
      });
    },
    [activePhrase, clearColorPreview, selectedWord, subtitleTrack]
  );
  return { onPreviewScopedColor, clearColorPreview };
}

export type SubtitleColorPreview = ReturnType<typeof useSubtitleColorPreview>;
