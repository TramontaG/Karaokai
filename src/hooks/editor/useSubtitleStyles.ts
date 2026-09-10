import { useCallback, type ChangeEvent } from "react";
import {
  type SubtitleAnimationTemplate,
  type SubtitleStyle,
} from "../../domain/project";
import {
  MAXIMUM_SCALE_PERCENTAGE,
  MINIMUM_SCALE_PERCENTAGE,
} from "../../util/editor/constants";
import { clamp } from "../../util/editor/numbers";
import { replacePhrase } from "../../util/editor/projectEditing";
import {
  optionalStyleScale,
  withoutStyleProperty,
} from "../../util/editor/subtitleStyles";
import { type SubtitlePropertyScope } from "../../util/editor/types";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorRuntime: Pick<EditorRuntime, "projectRef" | "previewCanvas">;
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  subtitleSelection: Pick<SubtitleSelection, "activePhrase" | "selectedWord">;
}

export function useSubtitleStyles({
  editorRuntime,
  editorProjectValues,
  editorHistory,
  subtitleSelection,
}: Options) {
  const { projectRef, previewCanvas } = editorRuntime;
  const { subtitleTrack } = editorProjectValues;
  const { persistProject } = editorHistory;
  const { activePhrase, selectedWord } = subtitleSelection;
  const updateScopedStyle = useCallback(
    (
      scope: SubtitlePropertyScope,
      property: keyof Pick<
        SubtitleStyle,
        | "unreadColor"
        | "readColor"
        | "x"
        | "y"
        | "fontFamily"
        | "fontWeight"
        | "fontStyle"
        | "textDecoration"
        | "verticalAlign"
      >,
      value: NonNullable<SubtitleStyle[typeof property]>
    ) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      if (scope === "track") {
        const bounds = previewCanvas.current?.getBoundingClientRect();
        const positionReference =
          property === "x" || property === "y"
            ? {
                positionReferenceWidth: Math.round(bounds?.width ?? 640),
                positionReferenceHeight: Math.round(bounds?.height ?? 360),
              }
            : {};
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? {
                  ...track,
                  style: {
                    ...track.style,
                    ...positionReference,
                    [property]: value,
                  },
                }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: { ...activePhrase.style, [property]: value },
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? { ...word, style: { ...word.style, [property]: value } }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );

  const resetScopedColor = useCallback(
    (
      scope: Exclude<SubtitlePropertyScope, "track">,
      property: keyof SubtitleStyle | "typography"
    ) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: withoutStyleProperty(activePhrase.style, property),
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? {
                  ...word,
                  style: withoutStyleProperty(word.style, property),
                }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );

  const updateScale = useCallback(
    (scope: SubtitlePropertyScope, scale: number | undefined) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      if (scope === "track") {
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? {
                  ...track,
                  style: { ...track.style, scale: scale ?? 1 },
                }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: optionalStyleScale(activePhrase.style, scale),
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? { ...word, style: optionalStyleScale(word.style, scale) }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );

  const commitScaleInput = useCallback(
    (
      scope: SubtitlePropertyScope,
      input: string,
      fallback: string,
      setInput: (value: string) => void
    ) => {
      if (input.trim() === "" && scope !== "track") {
        setInput("");
        updateScale(scope, undefined);
        return;
      }
      const parsed = Number(input);
      if (!Number.isFinite(parsed) || input.trim() === "") {
        setInput(fallback);
        return;
      }
      const normalized = Math.round(
        clamp(parsed, MINIMUM_SCALE_PERCENTAGE, MAXIMUM_SCALE_PERCENTAGE)
      );
      setInput(String(normalized));
      updateScale(scope, normalized / 100);
    },
    [updateScale]
  );

  const updateReadCurve = useCallback(
    (scope: SubtitlePropertyScope, value: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      const curve = value === "inherit" ? undefined : value;
      if (scope === "track") {
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? { ...track, curve: curve ?? "linear" }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        const phrase = { ...activePhrase };
        if (curve === undefined) delete phrase.curve;
        else phrase.curve = curve;
        persistProject(
          replacePhrase(
            currentProject,
            subtitleTrack.id,
            activePhrase.id,
            phrase
          )
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) => {
            if (word.id !== selectedWord.id) return word;
            const nextWord = { ...word };
            if (curve === undefined) delete nextWord.curve;
            else nextWord.curve = curve;
            return nextWord;
          }),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );

  const onUpdateTrackPosition = useCallback(
    (property: "x" | "y", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type === "subtitle" && track.id === subtitleTrack.id
            ? { ...track, style: { ...track.style, [property]: value } }
            : track
        ),
      });
    },
    [persistProject, subtitleTrack]
  );

  const onAnimationTemplateChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      const template = event.target.value as SubtitleAnimationTemplate;
      persistProject(
        {
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? { ...track, animation: { template } }
              : track
          ),
        },
        true
      );
    },
    [persistProject, subtitleTrack]
  );
  return {
    updateScopedStyle,
    resetScopedColor,
    commitScaleInput,
    updateReadCurve,
    onUpdateTrackPosition,
    onAnimationTemplateChange,
  };
}

export type SubtitleStyles = ReturnType<typeof useSubtitleStyles>;
