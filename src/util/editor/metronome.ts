import type { TempoGridLine } from "./tempoGrid";

// Schedule against the media clock, independently of React and animation frames.
export function createMetronome(
  media: HTMLAudioElement,
  context: AudioContext,
  lines: TempoGridLine[],
  volume: number
) {
  const output = context.createGain();
  output.gain.value = volume / 100;
  output.connect(context.destination);
  const voices = new Set<OscillatorNode>();
  let nextIndex = 0;
  let active = false;
  let disposed = false;

  const stop = () => {
    active = false;
    for (const voice of voices) {
      voice.stop();
      voice.disconnect();
    }
    voices.clear();
  };
  const tick = () => {
    if (
      !active ||
      media.paused ||
      media.ended ||
      media.seeking ||
      context.state !== "running"
    )
      return;
    const now = media.currentTime * 1000;
    const rate = media.playbackRate;
    if (rate <= 0) return;
    while (
      nextIndex < lines.length &&
      lines[nextIndex].time <= now + 100 * rate
    ) {
      const line = lines[nextIndex++];
      // Skip missed clicks after a stall instead of playing a burst.
      if (line.time < now - 30 * rate) continue;
      const at =
        context.currentTime + Math.max(0, (line.time - now) / (1000 * rate));
      const voice = context.createOscillator();
      const envelope = context.createGain();
      voice.frequency.value = line.isBar ? 1600 : 800;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.5, at + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.045);
      voice.connect(envelope);
      envelope.connect(output);
      voices.add(voice);
      voice.onended = () => {
        voices.delete(voice);
        voice.disconnect();
        envelope.disconnect();
      };
      voice.start(at);
      voice.stop(at + 0.05);
    }
  };
  const start = () => {
    stop();
    if (
      disposed ||
      media.paused ||
      media.ended ||
      media.seeking ||
      media.readyState < 3
    )
      return;
    const now = media.currentTime * 1000;
    // Binary search keeps seeks cheap even in long projects.
    let low = 0;
    let high = lines.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (lines[middle].time < now - 30 * media.playbackRate) low = middle + 1;
      else high = middle;
    }
    nextIndex = low;
    active = true;
    void context
      .resume()
      .then(() => {
        if (!disposed) tick();
      })
      .catch(() => {});
  };
  const startEvents = ["playing", "seeked", "ratechange"];
  const stopEvents = [
    "pause",
    "ended",
    "seeking",
    "waiting",
    "emptied",
    "error",
  ];
  startEvents.forEach((event) => media.addEventListener(event, start));
  stopEvents.forEach((event) => media.addEventListener(event, stop));
  const timer = setInterval(tick, 25);
  start();
  return {
    setVolume(value: number) {
      output.gain.setTargetAtTime(value / 100, context.currentTime, 0.01);
    },
    dispose() {
      disposed = true;
      clearInterval(timer);
      startEvents.forEach((event) => media.removeEventListener(event, start));
      stopEvents.forEach((event) => media.removeEventListener(event, stop));
      stop();
      output.disconnect();
    },
  };
}
