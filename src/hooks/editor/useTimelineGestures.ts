import { useTimelineGridPreferences } from "../useTimelineGridPreferences";
import {
  DEFAULT_BPM,
  MINIMUM_BPM,
  MAXIMUM_BPM,
} from "../../util/editor/constants";
import { snapTimeToGrid } from "../../util/editor/tempoGrid";
import { useCallback, type PointerEvent } from "react";
import {
  sortSubtitlePhrases,
  type SubtitlePhrase,
  type SubtitleTrack,
  type SubtitleWord,
} from "../../domain/project";
import {
  movePhrase,
  moveWordWithinPhrase,
  resizePhraseEnd,
  resizePhraseStart,
  resizeWordBoundary,
} from "../../screens/EditorScreen/timeline";
import { clamp } from "../../util/editor/numbers";
import {
  movePhraseToSubtitleTrack,
  replacePhrase,
} from "../../util/editor/projectEditing";
import { subtitleTrackIdAtPosition } from "../../util/editor/timelineGeometry";
import { type PhraseGesture } from "../../util/editor/types";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectChanges } from "./useEditorProjectChanges";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorRuntime: Pick<EditorRuntime, "projectRef" | "timelineContentRef">;
  editorDataState: Pick<
    EditorDataState,
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "selectedTrackId"
    | "selectedPhraseIds"
    | "setSelectedPhraseIds"
    | "setSelectedWordId"
  >;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  editorTransientState: Pick<
    EditorTransientState,
    "setTimelineDropTargetTrackId"
  >;
  editorProjectChanges: Pick<EditorProjectChanges, "setLiveProject">;
  editorHistory: Pick<EditorHistory, "persistProject">;
}

export function useTimelineGestures({
  editorRuntime,
  editorDataState,
  editorProjectValues,
  editorTransientState,
  editorProjectChanges,
  editorHistory,
}: Options) {
  const { timelineSubdivision, timelineSnapToGrid } =
    useTimelineGridPreferences();
  const { projectRef, timelineContentRef } = editorRuntime;
  const {
    setSelectedTrackId,
    setSelectedPhraseId,
    selectedTrackId,
    selectedPhraseIds,
    setSelectedPhraseIds,
    setSelectedWordId,
  } = editorDataState;
  const { timelineDuration } = editorProjectValues;
  const { setTimelineDropTargetTrackId } = editorTransientState;
  const { setLiveProject } = editorProjectChanges;
  const { persistProject } = editorHistory;
  const startGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      gesture: PhraseGesture,
      word?: SubtitleWord,
      wordEdge?: "start" | "end" | "move",
      initialClientX?: number
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceProject = projectRef.current;
      if (!sourceProject) return;
      const contentWidth =
        timelineContentRef.current?.getBoundingClientRect().width ?? 1;
      const initialX = initialClientX ?? event.clientX;
      setSelectedTrackId(track.id);
      setSelectedPhraseId(phrase.id);
      const selectedPhrases =
        gesture === "move" &&
        !word &&
        selectedTrackId === track.id &&
        selectedPhraseIds.includes(phrase.id)
          ? track.phrases.filter((item) => selectedPhraseIds.includes(item.id))
          : [phrase];
      setSelectedPhraseIds(selectedPhrases.map((item) => item.id));
      if (word) setSelectedWordId(word.id);

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        let delta = Math.round(
          ((moveEvent.clientX - initialX) / contentWidth) * timelineDuration
        );
        if (timelineSnapToGrid) {
          const anchor = word
            ? wordEdge === "end"
              ? word.end
              : word.start
            : gesture === "end"
              ? phrase.end
              : phrase.start;
          const bpm = clamp(
            sourceProject.tempo?.bpm ?? DEFAULT_BPM,
            MINIMUM_BPM,
            MAXIMUM_BPM
          );
          const offset = clamp(
            sourceProject.tempo?.offset ?? 0,
            0,
            timelineDuration
          );
          delta =
            snapTimeToGrid(anchor + delta, bpm, offset, timelineSubdivision) -
            anchor;
        }
        let nextPhrase = phrase;
        const targetTrackId =
          gesture === "move" && !word
            ? (subtitleTrackIdAtPosition(moveEvent.clientY) ?? track.id)
            : track.id;
        setTimelineDropTargetTrackId(
          targetTrackId === track.id ? null : targetTrackId
        );
        if (gesture === "move" && !word) setSelectedTrackId(targetTrackId);
        if (word && wordEdge) {
          nextPhrase =
            wordEdge === "move"
              ? moveWordWithinPhrase(phrase, word.id, delta, timelineDuration)
              : resizeWordBoundary(
                  phrase,
                  word.id,
                  wordEdge,
                  (wordEdge === "start" ? word.start : word.end) + delta,
                  timelineDuration
                );
        } else if (gesture === "move") {
          const groupDelta = clamp(
            delta,
            -Math.min(...selectedPhrases.map((item) => item.start)),
            timelineDuration -
              Math.max(...selectedPhrases.map((item) => item.end))
          );
          const nextPhrases = selectedPhrases.map((item) =>
            movePhrase(item, groupDelta, timelineDuration)
          );
          setLiveProject({
            ...sourceProject,
            updatedAt: String(Date.now()),
            tracks: sourceProject.tracks.map((item) => {
              if (item.type !== "subtitle") return item;
              if (item.id === track.id && item.id === targetTrackId)
                return {
                  ...item,
                  phrases: sortSubtitlePhrases(
                    item.phrases.map(
                      (itemPhrase) =>
                        nextPhrases.find((next) => next.id === itemPhrase.id) ??
                        itemPhrase
                    )
                  ),
                };
              if (item.id === track.id)
                return {
                  ...item,
                  phrases: item.phrases.filter(
                    (itemPhrase) => !selectedPhraseIds.includes(itemPhrase.id)
                  ),
                };
              if (item.id === targetTrackId)
                return {
                  ...item,
                  phrases: sortSubtitlePhrases([
                    ...item.phrases,
                    ...nextPhrases,
                  ]),
                };
              return item;
            }),
          });
          return;
        } else if (gesture === "start") {
          nextPhrase = resizePhraseStart(phrase, phrase.start + delta);
        } else {
          nextPhrase = resizePhraseEnd(
            phrase,
            phrase.end + delta,
            timelineDuration
          );
        }
        setLiveProject(
          targetTrackId === track.id
            ? replacePhrase(sourceProject, track.id, phrase.id, nextPhrase)
            : movePhraseToSubtitleTrack(
                sourceProject,
                track.id,
                targetTrackId,
                phrase.id,
                nextPhrase
              )
        );
      };
      const onFinish = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onFinish);
        window.removeEventListener("pointercancel", onFinish);
        setTimelineDropTargetTrackId(null);
        const changedProject = projectRef.current;
        if (changedProject) persistProject(changedProject, true, sourceProject);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onFinish, { once: true });
      window.addEventListener("pointercancel", onFinish, { once: true });
    },
    [
      persistProject,
      timelineSubdivision,
      timelineSnapToGrid,
      selectedPhraseIds,
      selectedTrackId,
      setLiveProject,
      setSelectedPhraseIds,
      timelineDuration,
    ]
  );

  const onStartPhraseGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      gesture: PhraseGesture,
      initialClientX?: number
    ) =>
      startGesture(
        event,
        track,
        phrase,
        gesture,
        undefined,
        undefined,
        initialClientX
      ),
    [startGesture]
  );

  const onStartWordGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      word: SubtitleWord,
      edge: "start" | "end" | "move",
      initialClientX?: number
    ) => startGesture(event, track, phrase, "move", word, edge, initialClientX),
    [startGesture]
  );
  return { onStartPhraseGesture, onStartWordGesture };
}

export type TimelineGestures = ReturnType<typeof useTimelineGestures>;
