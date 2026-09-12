import { useCallback, type MouseEvent } from "react";
import { type SubtitlePhrase, type SubtitleTrack } from "../../domain/project";
import { timeAtTimelinePosition } from "../../screens/EditorScreen/timeline";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorSelection } from "./useEditorSelection";
import type { EditorDataState } from "./useEditorDataState";
import type { TimelineTempo } from "./useTimelineTempo";

interface Options {
  editorRuntime: Pick<EditorRuntime, "hoveredPhraseRef" | "timelineContentRef">;
  editorSelection: Pick<EditorSelection, "clearPhraseSelection">;
  editorPlayback: Pick<EditorPlayback, "onSeek">;
  editorDataState: Pick<EditorDataState, "timelineTool">;
  timelineTempo: Pick<TimelineTempo, "addTimelineMarkerAt">;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
}

export function useTimelineInteractions({
  editorRuntime,
  editorSelection,
  editorPlayback,
  editorDataState,
  timelineTempo,
  editorProjectValues,
}: Options) {
  const { hoveredPhraseRef, timelineContentRef } = editorRuntime;
  const { clearPhraseSelection } = editorSelection;
  const { onSeek } = editorPlayback;
  const { timelineTool } = editorDataState;
  const { addTimelineMarkerAt } = timelineTempo;
  const { timelineDuration } = editorProjectValues;
  const onHoverPhrase = useCallback(
    (track: SubtitleTrack, phrase: SubtitlePhrase, clientX: number) => {
      hoveredPhraseRef.current = {
        trackId: track.id,
        phraseId: phrase.id,
        clientX,
      };
    },
    []
  );

  const onLeavePhrase = useCallback((phrase: SubtitlePhrase) => {
    if (hoveredPhraseRef.current?.phraseId === phrase.id)
      hoveredPhraseRef.current = null;
  }, []);

  const onTimelineClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (!target.closest("[data-timeline-phrase]")) clearPhraseSelection();
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const time = timeAtTimelinePosition(
        event.clientX,
        bounds.left,
        bounds.width,
        timelineDuration
      );
      if (timelineTool === "marker") {
        addTimelineMarkerAt(time);
        return;
      }
      onSeek(time);
    },
    [
      addTimelineMarkerAt,
      clearPhraseSelection,
      onSeek,
      timelineDuration,
      timelineTool,
    ]
  );
  return { onHoverPhrase, onLeavePhrase, onTimelineClick };
}

export type TimelineInteractions = ReturnType<typeof useTimelineInteractions>;
