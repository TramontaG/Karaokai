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
  >;
  timelineTempo: Pick<
    TimelineTempo,
    | "timelineGridStyle"
    | "tempoOffset"
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
  timelineInteractions,
  timelineViewport,
}: Options) {
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
  } = editorDataState;
  const {
    timelineGridStyle,
    tempoOffset,
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
  const { onTimelineClick } = timelineInteractions;
  const { onTimelineScroll } = timelineViewport;
  return {
    timelineRef,
    timelineLabelsRef,
    timelineContentRef,
    timelinePlayheadRef,
    timelineContentStyle: { width: `${timelineZoom * 100}%` },
    timelineGridStyle,
    timelineMarkers,
    timelineMarkerDeleteLabel: t("editor.timelineMarkerDelete"),
    hideTimelineGrid,
    hideTimelineClips,
    hideTimelinePlayhead,
    timelineAutoFollow,
    splitToolActive: timelineTool === "split",
    bpmInputValue,
    tempoOffsetSeconds: tempoOffset / 1000,
    maximumTempoOffsetSeconds: timelineDuration / 1000,
    timelineRows,
    timelineToolsLabel: t("editor.timelineTools"),
    splitToolLabel: t("editor.splitTool"),
    timelineAutoFollowLabel: t("editor.timelineAutoFollow"),
    bpmLabel: t("editor.bpm"),
    timelineRenderKey,
    onTimelineClick,
    onTimelineScroll,
    onRemoveTimelineMarker: removeTimelineMarker,
    onTimelineAutoFollowChange: (event: ChangeEvent<HTMLInputElement>) =>
      setTimelineAutoFollow(event.target.checked),
    onSelectPointerTool: () => setTimelineTool("pointer"),
    onToggleSplitTool: () =>
      setTimelineTool(timelineTool === "split" ? "pointer" : "split"),
    onBpmInput: (event: ChangeEvent<HTMLInputElement>) =>
      setBpmInputValue(event.target.value),
    onBpmBlur: commitBpmInput,
    onBpmKeyDown,
    onBeatOffsetInput: (event: ChangeEvent<HTMLInputElement>) =>
      updateTempo("offset", Number(event.target.value) * 1000),
  };
}

export type EditorTimelineView = ReturnType<typeof useEditorTimelineView>;
