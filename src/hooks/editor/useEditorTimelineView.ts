import { useTimelineGridPreferences } from "../useTimelineGridPreferences";
import { type ChangeEvent } from "react";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";
import type { TimelineInteractions } from "./useTimelineInteractions";
import type { TimelineRendering } from "./useTimelineRendering";
import type { TimelineTempo } from "./useTimelineTempo";
import type { TimelineViewport } from "./useTimelineViewport";
import type { SubtitlePhraseActions } from "./useSubtitlePhraseActions";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    | "timelineRef"
    | "timelineLabelsRef"
    | "timelineContentRef"
    | "timelinePlayheadRef"
  >;
  editorDataState: Pick<
    EditorDataState,
    | "timelineZoom"
    | "timelineTool"
    | "bpmInputValue"
    | "setTimelineTool"
    | "setBpmInputValue"
    | "selectedPhraseIds"
  >;
  timelineTempo: Pick<
    TimelineTempo,
    | "timelineGridLines"
    | "tempoOffset"
    | "removeAllTimelineMarkers"
    | "removeTimelineMarker"
    | "commitBpmInput"
    | "onBpmKeyDown"
    | "updateTempo"
  >;
  editorTransientState: Pick<
    EditorTransientState,
    | "timelineMarkers"
    | "hideTimelineGrid"
    | "hideTimelineClips"
    | "hideTimelinePlayhead"
  >;
  editorEnvironment: Pick<
    EditorEnvironment,
    "t" | "timelineAutoFollow" | "setTimelineAutoFollow"
  >;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  timelineRendering: Pick<
    TimelineRendering,
    "timelineRows" | "timelineRenderKey"
  >;
  subtitlePhraseActions: Pick<SubtitlePhraseActions, "onJoinPhrases">;
  timelineInteractions: Pick<TimelineInteractions, "onTimelineClick">;
  timelineViewport: Pick<TimelineViewport, "onTimelineScroll">;
}

export function useEditorTimelineView({
  editorRuntime,
  editorDataState,
  timelineTempo,
  editorTransientState,
  editorEnvironment,
  editorProjectValues,
  timelineRendering,
  subtitlePhraseActions,
  timelineInteractions,
  timelineViewport,
}: Options) {
  const {
    timelineSubdivision,
    timelineSnapToGrid,
    setTimelineSubdivision,
    setTimelineSnapToGrid,
  } = useTimelineGridPreferences();
  const {
    timelineRef,
    timelineLabelsRef,
    timelineContentRef,
    timelinePlayheadRef,
  } = editorRuntime;
  const {
    timelineZoom,
    timelineTool,
    bpmInputValue,
    setTimelineTool,
    setBpmInputValue,
    selectedPhraseIds,
  } = editorDataState;
  const {
    timelineGridLines,
    tempoOffset,
    removeAllTimelineMarkers,
    removeTimelineMarker,
    commitBpmInput,
    onBpmKeyDown,
    updateTempo,
  } = timelineTempo;
  const {
    timelineMarkers,
    hideTimelineGrid,
    hideTimelineClips,
    hideTimelinePlayhead,
  } = editorTransientState;
  const { t, timelineAutoFollow, setTimelineAutoFollow } = editorEnvironment;
  const { timelineDuration } = editorProjectValues;
  const { timelineRows, timelineRenderKey } = timelineRendering;
  const { onJoinPhrases } = subtitlePhraseActions;
  const { onTimelineClick } = timelineInteractions;
  const { onTimelineScroll } = timelineViewport;
  return {
    timelineRef,
    timelineLabelsRef,
    timelineContentRef,
    timelinePlayheadRef,
    timelineContentStyle: { width: `${timelineZoom * 100}%` },
    timelineGridLines,
    timelineMarkers,
    timelineMarkerDeleteLabel: t("editor.timelineMarkerDelete"),
    hideTimelineGrid,
    hideTimelineClips,
    hideTimelinePlayhead,
    timelineAutoFollow,
    timelineSubdivision,
    timelineSnapToGrid,
    subdivisionLabel: t("editor.timelineSubdivision"),
    snapToGridLabel: t("editor.timelineSnapToGrid"),
    onSubdivisionChange: () =>
      setTimelineSubdivision(
        timelineSubdivision === 32 ? 4 : timelineSubdivision * 2
      ),
    onSnapToGridChange: (event: ChangeEvent<HTMLInputElement>) =>
      setTimelineSnapToGrid(event.target.checked),
    splitToolActive: timelineTool === "split",
    markerToolActive: timelineTool === "marker",
    joinPhrasesDisabled: selectedPhraseIds.length < 2,
    bpmInputValue,
    tempoOffsetSeconds: tempoOffset / 1000,
    maximumTempoOffsetSeconds: timelineDuration / 1000,
    timelineRows,
    timelineToolsLabel: t("editor.timelineTools"),
    splitToolLabel: `${t("editor.splitTool")} (S)`,
    markerToolLabel: `${t("editor.markerTool")} (M)`,
    joinPhrasesLabel: `${t("editor.joinPhrases")} (J)`,
    timelineAutoFollowLabel: t("editor.timelineAutoFollow"),
    bpmLabel: t("editor.bpm"),
    timelineRenderKey,
    onTimelineClick,
    onTimelineScroll,
    onRemoveTimelineMarker: removeTimelineMarker,
    onRemoveAllTimelineMarkers: removeAllTimelineMarkers,
    removeAllTimelineMarkersLabel: t("editor.timelineMarkersDeleteAll"),
    removeAllTimelineMarkersDisabled: timelineMarkers.length === 0,
    onTimelineAutoFollowChange: (event: ChangeEvent<HTMLInputElement>) =>
      setTimelineAutoFollow(event.target.checked),
    onSelectPointerTool: () => setTimelineTool("pointer"),
    onToggleSplitTool: () =>
      setTimelineTool(timelineTool === "split" ? "pointer" : "split"),
    onToggleMarkerTool: () =>
      setTimelineTool(timelineTool === "marker" ? "pointer" : "marker"),
    onJoinPhrases,
    onBpmInput: (event: ChangeEvent<HTMLInputElement>) =>
      setBpmInputValue(event.target.value),
    onBpmBlur: commitBpmInput,
    onBpmKeyDown,
    onBeatOffsetInput: (event: ChangeEvent<HTMLInputElement>) =>
      updateTempo("offset", Number(event.target.value) * 1000),
  };
}

export type EditorTimelineView = ReturnType<typeof useEditorTimelineView>;
