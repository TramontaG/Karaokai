import { useRef } from "react";
import { type KaraokeProject, type SubtitlePhrase } from "../../domain/project";
import {
  type PlaybackProfiler,
  createPlaybackProfiler,
} from "../../util/editor/playbackProfiler";
import {
  type EditorHistoryEntry,
  type TimelineVisibleRange,
} from "../../util/editor/types";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    | "selectedTrackId"
    | "selectedPhraseId"
    | "selectedPhraseIds"
    | "phraseSelectionAnchorId"
    | "selectedWordId"
    | "timelineZoom"
  >;
  editorTransientState: Pick<EditorTransientState, "timelineVisibleRange">;
}

export function useEditorRuntime({
  editorDataState,
  editorTransientState,
}: Options) {
  const {
    selectedTrackId,
    selectedPhraseId,
    selectedPhraseIds,
    phraseSelectionAnchorId,
    selectedWordId,
    timelineZoom,
  } = editorDataState;
  const { timelineVisibleRange } = editorTransientState;
  const projectRef = useRef<KaraokeProject | null>(null);

  const currentTimeRef = useRef(0);

  const selectionRef = useRef({
    selectedTrackId,
    selectedPhraseId,
    selectedPhraseIds,
    phraseSelectionAnchorId,
    selectedWordId,
  });

  selectionRef.current = {
    selectedTrackId,
    selectedPhraseId,
    selectedPhraseIds,
    phraseSelectionAnchorId,
    selectedWordId,
  };

  const instrumentalAudio = useRef<HTMLAudioElement>(null);

  const vocalsAudio = useRef<HTMLAudioElement>(null);

  const backgroundVideo = useRef<HTMLVideoElement>(null);

  const backgroundImage = useRef<HTMLImageElement>(null);

  const previewCanvas = useRef<HTMLDivElement>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  const timelineLabelsRef = useRef<HTMLDivElement>(null);

  const timelineContentRef = useRef<HTMLDivElement>(null);

  const timelinePlayheadRef = useRef<HTMLDivElement>(null);

  const timelineVisibleRangeRef =
    useRef<TimelineVisibleRange>(timelineVisibleRange);

  const timelineContentWidthRef = useRef(0);

  const timelineZoomRef = useRef(timelineZoom);

  const timelineZoomingUntilRef = useRef(0);

  const hoveredPhraseRef = useRef<{
    trackId: string;
    phraseId: string;
    clientX: number;
  } | null>(null);

  const lastVocalsHardSyncRef = useRef(Number.NEGATIVE_INFINITY);

  const lastMediaSyncRef = useRef(Number.NEGATIVE_INFINITY);

  const lastTimelineFollowRef = useRef(Number.NEGATIVE_INFINITY);

  const playbackTimelineWordIdRef = useRef<string | null>(null);

  const playbackProfilerRef = useRef<PlaybackProfiler>(
    createPlaybackProfiler()
  );

  const saveTimerRef = useRef<number | null>(null);

  const closingWindowRef = useRef(false);

  const phraseClipboardRef = useRef<SubtitlePhrase[]>([]);

  const historyRef = useRef<EditorHistoryEntry[]>([]);

  const thumbnailCaptureKeyRef = useRef<string | null>(null);

  const thumbnailCaptureRef = useRef<(() => Promise<void>) | null>(null);

  const liveColorElementsRef = useRef<HTMLElement[]>([]);

  const exportLockRef = useRef(false);

  const renderJobIdRef = useRef<string | null>(null);

  const errorTimerRef = useRef<number | null>(null);
  return {
    errorTimerRef,
    exportLockRef,
    projectRef,
    saveTimerRef,
    selectionRef,
    historyRef,
    phraseClipboardRef,
    thumbnailCaptureRef,
    closingWindowRef,
    renderJobIdRef,
    thumbnailCaptureKeyRef,
    backgroundVideo,
    backgroundImage,
    currentTimeRef,
    instrumentalAudio,
    vocalsAudio,
    timelineZoomingUntilRef,
    lastTimelineFollowRef,
    timelineRef,
    timelineContentRef,
    timelineContentWidthRef,
    timelinePlayheadRef,
    timelineVisibleRangeRef,
    playbackTimelineWordIdRef,
    timelineZoomRef,
    timelineLabelsRef,
    previewCanvas,
    liveColorElementsRef,
    playbackProfilerRef,
    lastVocalsHardSyncRef,
    lastMediaSyncRef,
    hoveredPhraseRef,
  };
}

export type EditorRuntime = ReturnType<typeof useEditorRuntime>;
