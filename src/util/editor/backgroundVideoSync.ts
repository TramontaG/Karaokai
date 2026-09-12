const HARD_SYNC_THRESHOLD = 0.35;
const HARD_SYNC_INTERVAL = 1_000;
const PLAY_RETRY_INTERVAL = 1_000;

interface VideoSyncState {
  lastSeekAt: number;
  lastPlayAt: number;
  playPending: boolean;
  lastError: string | null;
  pendingTarget: number | null;
  pendingPlaying: boolean;
  pendingForce: boolean;
  seekedHandler: (() => void) | null;
}

/** Keep decoding uninterrupted for small drifts; reserve seeks for large ones. */
export function createBackgroundVideoSync() {
  const states = new WeakMap<HTMLVideoElement, VideoSyncState>();

  return function syncBackgroundVideo(
    video: HTMLVideoElement,
    seconds: number,
    playing: boolean,
    force = false,
    now = performance.now()
  ) {
    if (!Number.isFinite(seconds) || video.readyState < 1) return;
    let state = states.get(video);
    if (!state) {
      state = {
        lastSeekAt: -Infinity,
        lastPlayAt: -Infinity,
        playPending: false,
        lastError: null,
        pendingTarget: null,
        pendingPlaying: false,
        pendingForce: false,
        seekedHandler: null,
      };
      states.set(video, state);
    }
    const syncState = state;
    const ensureSeekedHandler = () => {
      if (syncState.seekedHandler) return;
      syncState.seekedHandler = () => {
        if (syncState.pendingTarget === null) return;
        syncBackgroundVideo(
          video,
          syncState.pendingTarget,
          syncState.pendingPlaying,
          syncState.pendingForce
        );
      };
      video.addEventListener("seeked", syncState.seekedHandler);
    };
    const duration = video.duration;
    const looping = video.loop && Number.isFinite(duration) && duration > 0;
    let target = looping ? seconds % duration : seconds;
    let drift = video.currentTime - target;
    // Frames just before and after a loop boundary are adjacent in time.
    if (looping) drift -= Math.round(drift / duration) * duration;

    if (video.seeking) {
      // Setting currentTime while a previous seek is decoding can continuously
      // cancel the decoder. Keep only the user's latest requested position.
      syncState.pendingTarget = target;
      syncState.pendingPlaying = playing;
      syncState.pendingForce ||= force;
      ensureSeekedHandler();
      if (!playing && !video.paused) video.pause();
      return;
    }

    if (syncState.pendingTarget !== null) {
      target = syncState.pendingTarget;
      playing = syncState.pendingPlaying;
      force ||= syncState.pendingForce;
      syncState.pendingTarget = null;
      syncState.pendingForce = false;
      drift = video.currentTime - target;
      if (looping) drift -= Math.round(drift / duration) * duration;
    }

    if (
      force ||
      (!video.seeking &&
        video.readyState >= 2 &&
        Math.abs(drift) > HARD_SYNC_THRESHOLD &&
        now - syncState.lastSeekAt >= HARD_SYNC_INTERVAL)
    ) {
      try {
        video.currentTime = target;
        video.playbackRate = 1;
        syncState.lastSeekAt = now;
        ensureSeekedHandler();
        // Do not restart playback until the requested frame is decoded.
        if (!playing && !video.paused) video.pause();
        return;
      } catch {
        // A source change can invalidate metadata between reads; retry later.
      }
    } else if (!video.seeking) {
      video.playbackRate = playing
        ? Math.min(1.05, Math.max(0.95, 1 - drift * 0.2))
        : 1;
    }

    if (!playing) {
      if (!video.paused) video.pause();
      return;
    }
    if (
      !video.paused ||
      video.error ||
      syncState.playPending ||
      now - syncState.lastPlayAt < PLAY_RETRY_INTERVAL
    )
      return;

    syncState.lastPlayAt = now;
    syncState.playPending = true;
    void video
      .play()
      .then(() => {
        syncState.lastError = null;
      })
      .catch((reason: unknown) => {
        // A seek, pause or source change may interrupt play; the next tick retries.
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        const message = String(reason);
        if (syncState.lastError !== message) {
          console.warn("Background video playback failed:", reason);
          syncState.lastError = message;
        }
      })
      .finally(() => {
        syncState.playPending = false;
      });
  };
}
