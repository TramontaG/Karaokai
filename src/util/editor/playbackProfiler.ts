import { PLAYBACK_PROFILER_STORAGE_KEY } from "./constants";

export type PlaybackProfiler = {
  enabled: boolean;
  windowStartedAt: number;
  previousFrameAt: number | null;
  frames: number;
  slowFrames: number;
  droppedFrames: number;
  totalFrameInterval: number;
  maximumFrameInterval: number;
  totalTick: number;
  maximumTick: number;
  totalVocalsSync: number;
  maximumVocalsSync: number;
  totalVideoSync: number;
  maximumVideoSync: number;
  totalPlayhead: number;
  maximumPlayhead: number;
  totalTimelineWord: number;
  maximumTimelineWord: number;
  totalTimelineFollow: number;
  maximumTimelineFollow: number;
};

export function playbackProfilerEnabled() {
  try {
    return (
      window.localStorage.getItem(PLAYBACK_PROFILER_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function debugFlagEnabled(key: string) {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function createPlaybackProfiler(): PlaybackProfiler {
  return {
    enabled: playbackProfilerEnabled(),
    windowStartedAt: performance.now(),
    previousFrameAt: null,
    frames: 0,
    slowFrames: 0,
    droppedFrames: 0,
    totalFrameInterval: 0,
    maximumFrameInterval: 0,
    totalTick: 0,
    maximumTick: 0,
    totalVocalsSync: 0,
    maximumVocalsSync: 0,
    totalVideoSync: 0,
    maximumVideoSync: 0,
    totalPlayhead: 0,
    maximumPlayhead: 0,
    totalTimelineWord: 0,
    maximumTimelineWord: 0,
    totalTimelineFollow: 0,
    maximumTimelineFollow: 0,
  };
}

export function resetPlaybackProfiler(profiler: PlaybackProfiler, now: number) {
  Object.assign(profiler, createPlaybackProfiler(), {
    enabled: true,
    windowStartedAt: now,
    previousFrameAt: now,
  });
}
