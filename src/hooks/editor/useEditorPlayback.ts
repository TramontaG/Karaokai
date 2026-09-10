import { useCallback, useEffect } from "react";
import {
  MEDIA_SYNC_INTERVAL,
  PLAYBACK_FRAME_BUDGET_MS,
  PLAYBACK_JANK_BUDGET_MS,
  VOCALS_HARD_SYNC_INTERVAL,
  VOCALS_HARD_SYNC_THRESHOLD,
  VOCALS_SYNC_RATE_ADJUSTMENT,
} from "../../util/editor/constants";
import { clamp } from "../../util/editor/numbers";
import { resetPlaybackProfiler } from "../../util/editor/playbackProfiler";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorMedia } from "./useEditorMedia";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { TimelineViewport } from "./useTimelineViewport";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    | "instrumentalAudio"
    | "vocalsAudio"
    | "backgroundVideo"
    | "currentTimeRef"
    | "playbackProfilerRef"
    | "lastVocalsHardSyncRef"
    | "lastMediaSyncRef"
  >;
  editorMedia: Pick<
    EditorMedia,
    | "instrumentalSource"
    | "updateMediaTime"
    | "vocalsSource"
    | "syncBackgroundVideoTime"
  >;
  editorDataState: Pick<
    EditorDataState,
    | "setError"
    | "isPlaying"
    | "setIsPlaying"
    | "setCurrentTime"
    | "setIsAudioReady"
    | "currentTime"
  >;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  timelineViewport: Pick<
    TimelineViewport,
    "updateTimelinePlayhead" | "updateTimelinePlaybackWord" | "followTimelineAt"
  >;
}

export function useEditorPlayback({
  editorRuntime,
  editorMedia,
  editorDataState,
  editorEnvironment,
  editorProjectValues,
  timelineViewport,
}: Options) {
  const {
    instrumentalAudio,
    vocalsAudio,
    backgroundVideo,
    currentTimeRef,
    playbackProfilerRef,
    lastVocalsHardSyncRef,
    lastMediaSyncRef,
  } = editorRuntime;
  const {
    instrumentalSource,
    updateMediaTime,
    vocalsSource,
    syncBackgroundVideoTime,
  } = editorMedia;
  const {
    setError,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setIsAudioReady,
    currentTime,
  } = editorDataState;
  const { t } = editorEnvironment;
  const { timelineDuration } = editorProjectValues;
  const {
    updateTimelinePlayhead,
    updateTimelinePlaybackWord,
    followTimelineAt,
  } = timelineViewport;
  const onTogglePlayback = useCallback(() => {
    const instrumental = instrumentalAudio.current;
    const vocals = vocalsAudio.current;
    if (!instrumental || !instrumentalSource) {
      setError(t("editor.audioUnavailable"));
      return;
    }
    if (isPlaying) {
      instrumental.pause();
      vocals?.pause();
      backgroundVideo.current?.pause();
      setIsPlaying(false);
      return;
    }
    updateMediaTime(currentTimeRef.current);
    const instrumentalPlayback = instrumental.play();
    const vocalsPlayback =
      vocals && vocalsSource
        ? vocals.play().catch((reason) => {
            setError(
              t("editor.vocalsPlaybackError", { details: String(reason) })
            );
          })
        : Promise.resolve();
    void (async () => {
      try {
        await instrumentalPlayback;
        setIsPlaying(true);
        void backgroundVideo.current?.play().catch(() => undefined);
        await vocalsPlayback;
      } catch (reason) {
        instrumental.pause();
        vocals?.pause();
        backgroundVideo.current?.pause();
        setError(t("editor.audioPlaybackError", { details: String(reason) }));
        setIsPlaying(false);
      }
    })();
  }, [instrumentalSource, isPlaying, t, updateMediaTime, vocalsSource]);

  const onSeek = useCallback(
    (value: number) => {
      const next = clamp(value, 0, timelineDuration);
      updateMediaTime(next);
      currentTimeRef.current = next;
      updateTimelinePlayhead(next);
      updateTimelinePlaybackWord(next);
      setCurrentTime(next);
      followTimelineAt(next);
    },
    [
      followTimelineAt,
      timelineDuration,
      updateMediaTime,
      updateTimelinePlaybackWord,
      updateTimelinePlayhead,
    ]
  );

  const updatePlaybackClock = useCallback(() => {
    const profiler = playbackProfilerRef.current;
    const frameStartedAt = profiler.enabled ? performance.now() : 0;
    const audio = instrumentalAudio.current;
    const vocals = vocalsAudio.current;
    if (!audio) return;
    if (vocals) {
      const vocalsSyncStartedAt = profiler.enabled ? performance.now() : 0;
      const drift = vocals.currentTime - audio.currentTime;
      const now = performance.now();

      if (
        Math.abs(drift) > VOCALS_HARD_SYNC_THRESHOLD &&
        now - lastVocalsHardSyncRef.current >= VOCALS_HARD_SYNC_INTERVAL
      ) {
        vocals.currentTime = audio.currentTime;
        vocals.playbackRate = 1;
        lastVocalsHardSyncRef.current = now;
      } else {
        vocals.playbackRate = clamp(
          1 - drift * VOCALS_SYNC_RATE_ADJUSTMENT,
          0.96,
          1.04
        );
      }
      if (profiler.enabled) {
        const duration = performance.now() - vocalsSyncStartedAt;
        profiler.totalVocalsSync += duration;
        profiler.maximumVocalsSync = Math.max(
          profiler.maximumVocalsSync,
          duration
        );
      }
    }
    const now = performance.now();
    if (now - lastMediaSyncRef.current >= MEDIA_SYNC_INTERVAL) {
      const videoSyncStartedAt = profiler.enabled ? performance.now() : 0;
      syncBackgroundVideoTime(audio.currentTime);
      lastMediaSyncRef.current = now;
      if (profiler.enabled) {
        const duration = performance.now() - videoSyncStartedAt;
        profiler.totalVideoSync += duration;
        profiler.maximumVideoSync = Math.max(
          profiler.maximumVideoSync,
          duration
        );
      }
    }
    const next = Math.round(audio.currentTime * 1000);
    currentTimeRef.current = next;
    const playheadStartedAt = profiler.enabled ? performance.now() : 0;
    updateTimelinePlayhead(next);
    if (profiler.enabled) {
      const duration = performance.now() - playheadStartedAt;
      profiler.totalPlayhead += duration;
      profiler.maximumPlayhead = Math.max(profiler.maximumPlayhead, duration);
    }
    const timelineWordStartedAt = profiler.enabled ? performance.now() : 0;
    updateTimelinePlaybackWord(next);
    if (profiler.enabled) {
      const duration = performance.now() - timelineWordStartedAt;
      profiler.totalTimelineWord += duration;
      profiler.maximumTimelineWord = Math.max(
        profiler.maximumTimelineWord,
        duration
      );
    }
    setCurrentTime(next);
    const timelineFollowStartedAt = profiler.enabled ? performance.now() : 0;
    followTimelineAt(next);
    if (!profiler.enabled) return;

    const completedAt = performance.now();
    const tickDuration = completedAt - frameStartedAt;
    const frameInterval = profiler.previousFrameAt
      ? completedAt - profiler.previousFrameAt
      : 0;
    profiler.previousFrameAt = completedAt;
    profiler.frames += 1;
    profiler.totalTick += tickDuration;
    profiler.maximumTick = Math.max(profiler.maximumTick, tickDuration);
    profiler.totalTimelineFollow += completedAt - timelineFollowStartedAt;
    profiler.maximumTimelineFollow = Math.max(
      profiler.maximumTimelineFollow,
      completedAt - timelineFollowStartedAt
    );
    if (frameInterval > 0) {
      profiler.totalFrameInterval += frameInterval;
      profiler.maximumFrameInterval = Math.max(
        profiler.maximumFrameInterval,
        frameInterval
      );
      if (frameInterval > PLAYBACK_FRAME_BUDGET_MS) profiler.slowFrames += 1;
      if (frameInterval > PLAYBACK_JANK_BUDGET_MS) profiler.droppedFrames += 1;
    }
    if (completedAt - profiler.windowStartedAt < 1_000) return;
    const intervals = Math.max(1, profiler.frames - 1);
    console.table({
      fps: Number(
        (1000 / (profiler.totalFrameInterval / intervals)).toFixed(1)
      ),
      frameAverageMs: Number(
        (profiler.totalFrameInterval / intervals).toFixed(2)
      ),
      frameMaximumMs: Number(profiler.maximumFrameInterval.toFixed(2)),
      tickAverageMs: Number((profiler.totalTick / profiler.frames).toFixed(2)),
      tickMaximumMs: Number(profiler.maximumTick.toFixed(2)),
      framesOver8_33ms: profiler.slowFrames,
      framesOver16_67ms: profiler.droppedFrames,
      vocalsSyncMaximumMs: Number(profiler.maximumVocalsSync.toFixed(2)),
      videoSyncMaximumMs: Number(profiler.maximumVideoSync.toFixed(2)),
      playheadMaximumMs: Number(profiler.maximumPlayhead.toFixed(2)),
      timelineWordMaximumMs: Number(profiler.maximumTimelineWord.toFixed(2)),
      timelineFollowMaximumMs: Number(
        profiler.maximumTimelineFollow.toFixed(2)
      ),
    });
    resetPlaybackProfiler(profiler, completedAt);
  }, [
    followTimelineAt,
    syncBackgroundVideoTime,
    updateTimelinePlaybackWord,
    updateTimelinePlayhead,
  ]);

  useEffect(() => {
    if (!isPlaying) return;
    let frameId = 0;
    const updateFrame = () => {
      updatePlaybackClock();
      frameId = window.requestAnimationFrame(updateFrame);
    };
    frameId = window.requestAnimationFrame(updateFrame);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, updatePlaybackClock]);

  const onPlaybackEnded = useCallback(() => {
    const audio = instrumentalAudio.current;
    if (audio) {
      const next = Math.round(audio.currentTime * 1000);
      currentTimeRef.current = next;
      updateTimelinePlayhead(next);
      setCurrentTime(next);
      followTimelineAt(next);
    }
    vocalsAudio.current?.pause();
    backgroundVideo.current?.pause();
    setIsPlaying(false);
  }, [followTimelineAt, updateTimelinePlayhead]);

  const onInstrumentalError = useCallback(() => {
    setError(
      t("editor.audioLoadError", {
        code: String(instrumentalAudio.current?.error?.code ?? 0),
      })
    );
    setIsAudioReady(false);
    setIsPlaying(false);
    backgroundVideo.current?.pause();
  }, [t]);

  const onInstrumentalCanPlay = useCallback(() => {
    setIsAudioReady(true);
    setError(null);
  }, []);

  const onSkipBack = useCallback(
    () => onSeek(currentTime - 5_000),
    [currentTime, onSeek]
  );

  const onSkipForward = useCallback(
    () => onSeek(currentTime + 5_000),
    [currentTime, onSeek]
  );
  return {
    onSeek,
    onTogglePlayback,
    onSkipBack,
    onSkipForward,
    onPlaybackEnded,
    onInstrumentalError,
    onInstrumentalCanPlay,
  };
}

export type EditorPlayback = ReturnType<typeof useEditorPlayback>;
