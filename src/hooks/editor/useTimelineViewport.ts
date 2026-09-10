import { useCallback, useEffect, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import {
  subtitlePreviewAt,
  timelineFollowScrollLeft,
} from "../../screens/EditorScreen/timeline";
import {
  TIMELINE_FOLLOW_INTERVAL,
  TIMELINE_VIRTUALIZATION_MARGIN,
} from "../../util/editor/constants";
import { clamp } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorEnvironment: Pick<EditorEnvironment, "timelineAutoFollow">;
  editorRuntime: Pick<
    EditorRuntime,
    | "timelineZoomingUntilRef"
    | "lastTimelineFollowRef"
    | "timelineRef"
    | "timelineContentRef"
    | "timelineContentWidthRef"
    | "timelinePlayheadRef"
    | "timelineVisibleRangeRef"
    | "playbackTimelineWordIdRef"
    | "currentTimeRef"
    | "timelineZoomRef"
    | "timelineLabelsRef"
  >;
  editorProjectValues: Pick<
    EditorProjectValues,
    "timelineDuration" | "subtitleTracks"
  >;
  editorTransientState: Pick<EditorTransientState, "setTimelineVisibleRange">;
  editorDataState: Pick<EditorDataState, "timelineZoom" | "setEditorData">;
}

export function useTimelineViewport({
  editorEnvironment,
  editorRuntime,
  editorProjectValues,
  editorTransientState,
  editorDataState,
}: Options) {
  const { timelineAutoFollow } = editorEnvironment;
  const {
    timelineZoomingUntilRef,
    lastTimelineFollowRef,
    timelineRef,
    timelineContentRef,
    timelineContentWidthRef,
    timelinePlayheadRef,
    timelineVisibleRangeRef,
    playbackTimelineWordIdRef,
    currentTimeRef,
    timelineZoomRef,
    timelineLabelsRef,
  } = editorRuntime;
  const { timelineDuration, subtitleTracks } = editorProjectValues;
  const { setTimelineVisibleRange } = editorTransientState;
  const { timelineZoom, setEditorData } = editorDataState;
  const followTimelineAt = useCallback(
    (milliseconds: number) => {
      if (!timelineAutoFollow) return;
      const now = performance.now();
      if (
        now < timelineZoomingUntilRef.current ||
        now - lastTimelineFollowRef.current < TIMELINE_FOLLOW_INTERVAL
      )
        return;
      const viewport = timelineRef.current;
      const content = timelineContentRef.current;
      if (!viewport || !content) return;
      const nextScrollLeft = timelineFollowScrollLeft(
        milliseconds,
        timelineDuration,
        content.offsetLeft,
        timelineContentWidthRef.current,
        viewport.clientWidth,
        viewport.scrollWidth
      );
      if (Math.abs(viewport.scrollLeft - nextScrollLeft) < 1) return;
      lastTimelineFollowRef.current = now;
      viewport.scrollLeft = nextScrollLeft;
    },
    [timelineAutoFollow, timelineDuration]
  );

  const updateTimelinePlayhead = useCallback(
    (milliseconds: number) => {
      const playhead = timelinePlayheadRef.current;
      if (!playhead) return;
      const position =
        timelineContentWidthRef.current *
        clamp(milliseconds / Math.max(1, timelineDuration), 0, 1);
      playhead.style.transform = `translate3d(${position}px, 0, 0)`;
    },
    [timelineDuration]
  );

  const updateTimelineVisibleRange = useCallback(() => {
    const viewport = timelineRef.current;
    const content = timelineContentRef.current;
    if (!viewport || !content || timelineContentWidthRef.current <= 0) return;

    const visibleStart = clamp(
      ((viewport.scrollLeft - content.offsetLeft) /
        timelineContentWidthRef.current) *
        timelineDuration,
      0,
      timelineDuration
    );
    const visibleEnd = clamp(
      ((viewport.scrollLeft - content.offsetLeft + viewport.clientWidth) /
        timelineContentWidthRef.current) *
        timelineDuration,
      0,
      timelineDuration
    );
    const visibleDuration = Math.max(1, visibleEnd - visibleStart);
    const current = timelineVisibleRangeRef.current;
    const safeStart = current.start + visibleDuration * 0.5;
    const safeEnd = current.end - visibleDuration * 0.5;
    if (
      current.end > current.start &&
      visibleStart >= safeStart &&
      visibleEnd <= safeEnd
    )
      return;

    const margin = visibleDuration * TIMELINE_VIRTUALIZATION_MARGIN;
    const next = {
      start: Math.max(0, visibleStart - margin),
      end: Math.min(timelineDuration, visibleEnd + margin),
    };
    timelineVisibleRangeRef.current = next;
    setTimelineVisibleRange(next);
  }, [timelineDuration]);

  const updateTimelinePlaybackWord = useCallback(
    (milliseconds: number) => {
      let nextWordId: string | null = null;
      for (const track of subtitleTracks) {
        const phrase = subtitlePreviewAt(
          track.phrases,
          milliseconds,
          track.animation?.template ?? "template-1"
        ).currentPhrase;
        const word = phrase?.words.find(
          (item) =>
            item.type !== "gap" &&
            milliseconds >= item.start &&
            milliseconds <= item.end
        );
        if (word) {
          nextWordId = word.id;
          break;
        }
      }
      if (nextWordId === playbackTimelineWordIdRef.current) return;
      if (playbackTimelineWordIdRef.current) {
        document
          .querySelector<HTMLElement>(
            `[data-timeline-word-id="${playbackTimelineWordIdRef.current}"]`
          )
          ?.removeAttribute("data-playback-active");
      }
      if (nextWordId) {
        document
          .querySelector<HTMLElement>(`[data-timeline-word-id="${nextWordId}"]`)
          ?.setAttribute("data-playback-active", "true");
      }
      playbackTimelineWordIdRef.current = nextWordId;
    },
    [subtitleTracks]
  );

  useEffect(() => {
    if (timelineAutoFollow) followTimelineAt(currentTimeRef.current);
  }, [followTimelineAt, timelineAutoFollow]);

  useLayoutEffect(() => {
    const content = timelineContentRef.current;
    if (!content) return;
    const updateContentWidth = () => {
      timelineContentWidthRef.current = content.clientWidth;
      updateTimelinePlayhead(currentTimeRef.current);
      updateTimelineVisibleRange();
    };
    updateContentWidth();
    const observer = new ResizeObserver(updateContentWidth);
    observer.observe(content);
    return () => observer.disconnect();
  }, [timelineZoom, updateTimelinePlayhead, updateTimelineVisibleRange]);

  const onTimelineWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const viewport = timelineRef.current;
      const content = timelineContentRef.current;
      if (!viewport || !content) return;
      const previousZoom = timelineZoomRef.current;
      const nextZoom = clamp(
        previousZoom * (event.deltaY < 0 ? 1.16 : 1 / 1.16),
        1,
        256
      );
      if (nextZoom === previousZoom) return;
      const viewportBounds = viewport.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();
      const cursorPosition = clamp(
        event.clientX - viewportBounds.left,
        0,
        viewport.clientWidth
      );
      const contentPosition = clamp(
        (event.clientX - contentBounds.left) / Math.max(1, contentBounds.width),
        0,
        1
      );
      timelineZoomRef.current = nextZoom;
      timelineZoomingUntilRef.current = performance.now() + 150;
      flushSync(() => setEditorData({ timelineZoom: nextZoom }));
      const maximumScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth
      );
      viewport.scrollLeft = clamp(
        content.offsetLeft +
          content.offsetWidth * contentPosition -
          cursorPosition,
        0,
        maximumScrollLeft
      );
    },
    [setEditorData]
  );

  useEffect(() => {
    const viewport = timelineRef.current;
    if (!viewport) return;

    viewport.addEventListener("wheel", onTimelineWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onTimelineWheel);
  }, [onTimelineWheel]);

  const onTimelineScroll = useCallback(() => {
    const viewport = timelineRef.current;
    const labels = timelineLabelsRef.current;
    if (!viewport || !labels) return;
    labels.scrollTop = viewport.scrollTop;
    updateTimelineVisibleRange();
  }, [updateTimelineVisibleRange]);
  return {
    updateTimelinePlayhead,
    updateTimelinePlaybackWord,
    followTimelineAt,
    onTimelineScroll,
  };
}

export type TimelineViewport = ReturnType<typeof useTimelineViewport>;
