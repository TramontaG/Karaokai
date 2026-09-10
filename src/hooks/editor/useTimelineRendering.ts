import { Image, Music2, Subtitles, Type } from "lucide-react";
import { createElement, useCallback, useMemo, type MouseEvent } from "react";
import {
  hasSubtitlePhraseTiming,
  type ProjectTrack,
} from "../../domain/project";
import { PhraseClip } from "../../screens/EditorScreen/components/PhraseClip";
import {
  TimelineClip,
  TimelineLabel,
  TimelineLane,
} from "../../screens/EditorScreen/styles";
import { type TimelineRow } from "../../util/editor/types";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorSelection } from "./useEditorSelection";
import type { EditorTransientState } from "./useEditorTransientState";
import type { SubtitlePhraseActions } from "./useSubtitlePhraseActions";
import type { TimelineGestures } from "./useTimelineGestures";
import type { TimelineInteractions } from "./useTimelineInteractions";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    | "project"
    | "selectedTrackId"
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "setSelectedWordId"
    | "timelineTool"
    | "selectedPhraseIds"
    | "selectedWordId"
    | "selectedPhraseId"
    | "bpmInputValue"
    | "timelineZoom"
  >;
  timelineInteractions: Pick<
    TimelineInteractions,
    "onHoverPhrase" | "onLeavePhrase"
  >;
  editorSelection: Pick<EditorSelection, "onSelectPhrase" | "onSelectWord">;
  subtitlePhraseActions: Pick<
    SubtitlePhraseActions,
    "onSplitPhrase" | "onInsertPhrase"
  >;
  timelineGestures: Pick<
    TimelineGestures,
    "onStartPhraseGesture" | "onStartWordGesture"
  >;
  editorTransientState: Pick<
    EditorTransientState,
    "timelineDropTargetTrackId" | "timelineVisibleRange" | "timelineMarkers"
  >;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  editorEnvironment: Pick<
    EditorEnvironment,
    "data" | "t" | "timelineAutoFollow"
  >;
}

export function useTimelineRendering({
  editorDataState,
  timelineInteractions,
  editorSelection,
  subtitlePhraseActions,
  timelineGestures,
  editorTransientState,
  editorProjectValues,
  editorEnvironment,
}: Options) {
  const {
    project,
    selectedTrackId,
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedWordId,
    timelineTool,
    selectedPhraseIds,
    selectedWordId,
    selectedPhraseId,
    bpmInputValue,
    timelineZoom,
  } = editorDataState;
  const { onHoverPhrase, onLeavePhrase } = timelineInteractions;
  const { onSelectPhrase, onSelectWord } = editorSelection;
  const { onSplitPhrase, onInsertPhrase } = subtitlePhraseActions;
  const { onStartPhraseGesture, onStartWordGesture } = timelineGestures;
  const { timelineDropTargetTrackId, timelineVisibleRange, timelineMarkers } =
    editorTransientState;
  const { timelineDuration } = editorProjectValues;
  const { data, t, timelineAutoFollow } = editorEnvironment;
  const timelineRows = useMemo(() => {
    const priority: Record<ProjectTrack["type"], number> = {
      background: 0,
      image: 1,
      subtitle: 2,
      text: 3,
      audio: 4,
    };
    const icons: Record<ProjectTrack["type"], typeof Image> = {
      background: Image,
      image: Image,
      subtitle: Subtitles,
      text: Type,
      audio: Music2,
    };
    return [...(project?.tracks ?? [])]
      .sort(
        (left, right) =>
          priority[left.type] - priority[right.type] ||
          left.zIndex - right.zIndex
      )
      .map<TimelineRow>((track) => ({
        id: track.id,
        type: track.type,
        label: track.name,
        Icon: icons[track.type],
        track,
      }));
  }, [project?.tracks]);

  const renderTimelineLabel = useCallback(
    (row: TimelineRow) =>
      createElement(
        TimelineLabel,
        {
          type: "button",
          $selected: row.id === selectedTrackId,
          onClick: () => {
            setSelectedTrackId(row.id);
            setSelectedPhraseId(null);
            setSelectedWordId(null);
          },
        },
        createElement(row.Icon, { size: 15 }),
        createElement("span", undefined, row.label)
      ),
    [selectedTrackId]
  );

  const timelineInteractionKey = useMemo(
    () => ({}),
    [
      onHoverPhrase,
      onLeavePhrase,
      onSelectPhrase,
      onSelectWord,
      onSplitPhrase,
      onStartPhraseGesture,
      onStartWordGesture,
      timelineTool,
    ]
  );

  const renderTimelineRow = useCallback(
    (row: TimelineRow) => {
      if (row.track?.type === "subtitle") {
        const track = row.track;
        return createElement(
          TimelineLane,
          {
            $splitting: timelineTool === "split",
            $dropTarget: track.id === timelineDropTargetTrackId,
            "data-subtitle-track-id": track.id,
            onDoubleClick: (event: MouseEvent<HTMLDivElement>) =>
              onInsertPhrase(event, track),
          },
          ...track.phrases
            .filter(
              (phrase) =>
                hasSubtitlePhraseTiming(phrase) &&
                phrase.end >= timelineVisibleRange.start &&
                phrase.start <= timelineVisibleRange.end
            )
            .map((phrase) => {
              const phraseDuration = Math.max(1, phrase.end - phrase.start);
              return createElement(PhraseClip, {
                key: phrase.id,
                phrase,
                left: `${(phrase.start / timelineDuration) * 100}%`,
                width: `${Math.max(0.12, (phraseDuration / timelineDuration) * 100)}%`,
                selected:
                  track.id === selectedTrackId &&
                  selectedPhraseIds.includes(phrase.id),
                splitting: timelineTool === "split",
                interactionKey: timelineInteractionKey,
                words: phrase.words.map((word) => ({
                  ...word,
                  left: `${((word.start - phrase.start) / phraseDuration) * 100}%`,
                  width: `${Math.max(0.4, ((word.end - word.start) / phraseDuration) * 100)}%`,
                  active: false,
                  selected:
                    track.id === selectedTrackId && word.id === selectedWordId,
                })),
                onSelect: (selectedPhrase, event) =>
                  onSelectPhrase(track.id, selectedPhrase, event),
                onSelectWord: (selectedPhrase, word, clientX) =>
                  onSelectWord(track.id, selectedPhrase, word, clientX),
                onHoverPhrase: (hoveredPhrase, clientX) =>
                  onHoverPhrase(track, hoveredPhrase, clientX),
                onLeavePhrase,
                onSplitPhrase: (selectedPhrase, clientX) =>
                  onSplitPhrase(track, selectedPhrase, clientX),
                onStartPhraseGesture: (
                  event,
                  selectedPhrase,
                  gesture,
                  initialClientX
                ) =>
                  onStartPhraseGesture(
                    event,
                    track,
                    selectedPhrase,
                    gesture,
                    initialClientX
                  ),
                onStartWordGesture: (
                  event,
                  selectedPhrase,
                  word,
                  edge,
                  initialClientX
                ) =>
                  onStartWordGesture(
                    event,
                    track,
                    selectedPhrase,
                    word,
                    edge,
                    initialClientX
                  ),
              });
            })
        );
      }

      return createElement(
        TimelineLane,
        { $splitting: timelineTool === "split", $dropTarget: false },
        createElement(
          TimelineClip,
          {
            type: "button",
            $selected: row.id === selectedTrackId,
            $tone: row.type === "audio" ? "audio" : "background",
            style: { left: 0, width: "100%" },
          },
          row.label
        )
      );
    },
    [
      onInsertPhrase,
      onSelectPhrase,
      onSelectWord,
      onStartPhraseGesture,
      onStartWordGesture,
      onHoverPhrase,
      onLeavePhrase,
      onSplitPhrase,
      selectedPhraseId,
      selectedPhraseIds,
      selectedTrackId,
      selectedWordId,
      timelineDropTargetTrackId,
      timelineInteractionKey,
      timelineTool,
      timelineDuration,
      timelineVisibleRange,
    ]
  );

  const timelineRenderKey = useMemo(
    () => ({}),
    [
      bpmInputValue,
      data.preferences.storageDirectory,
      project,
      selectedPhraseId,
      selectedPhraseIds,
      selectedTrackId,
      selectedWordId,
      t,
      timelineAutoFollow,
      timelineMarkers,
      timelineTool,
      timelineVisibleRange,
      timelineZoom,
    ]
  );
  return {
    renderTimelineLabel,
    renderTimelineRow,
    timelineRows,
    timelineRenderKey,
  };
}

export type TimelineRendering = ReturnType<typeof useTimelineRendering>;
