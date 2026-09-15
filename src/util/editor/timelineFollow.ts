interface ScrollHost {
  read: () => number;
  write: (position: number) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
}

// Retarget one animation instead of starting a new native smooth-scroll on
// every playback tick. Time-based easing behaves the same at 60 and 120 Hz.
export function createTimelineFollowScroll(host: ScrollHost) {
  let target = 0;
  let frame: number | null = null;
  let previousTime: number | null = null;
  let position: number | null = null;
  let lastWritten: number | null = null;
  const animate = (now: number) => {
    frame = null;
    const elapsed =
      previousTime === null ? 1000 / 60 : Math.max(0, now - previousTime);
    previousTime = now;
    const current = host.read();
    // Keep fractional progress even when the browser rounds scrollLeft to
    // device pixels. Reset it if the user scrolled between animation frames.
    if (position === null || current !== lastWritten) position = current;
    const distance = target - position;
    if (Math.abs(distance) <= 0.5) {
      host.write(target);
      position = target;
      lastWritten = host.read();
      previousTime = null;
      return;
    }
    position += distance * (1 - Math.exp(-elapsed / 80));
    host.write(position);
    lastWritten = host.read();
    frame = host.requestFrame(animate);
  };
  return {
    follow(position: number) {
      if (!Number.isFinite(position)) return;
      target = position;
      if (frame === null) frame = host.requestFrame(animate);
    },
    cancel() {
      if (frame !== null) host.cancelFrame(frame);
      frame = null;
      previousTime = null;
      position = null;
      lastWritten = null;
    },
  };
}

export function timelineRangeContainsViewport(
  range: { start: number; end: number },
  visibleStart: number,
  visibleEnd: number,
  duration: number
) {
  const margin = Math.max(1, visibleEnd - visibleStart) * 0.5;
  // At project edges the virtualized range cannot extend any further. Treat
  // those edges as covered instead of rebuilding tracks on every scroll event.
  const safeStart = range.start === 0 ? 0 : range.start + margin;
  const safeEnd = range.end >= duration ? duration : range.end - margin;
  return (
    range.end > range.start &&
    visibleStart >= safeStart &&
    visibleEnd <= safeEnd
  );
}
