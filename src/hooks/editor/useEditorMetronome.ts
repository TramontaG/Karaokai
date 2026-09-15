import { useEffect, useRef, type RefObject } from "react";
import { useMetronomePreferences } from "../useMetronomePreferences";
import { createMetronome } from "../../util/editor/metronome";
import type { TempoGridLine } from "../../util/editor/tempoGrid";

export function useEditorMetronome(
  audio: RefObject<HTMLAudioElement | null>,
  lines: TempoGridLine[],
  source: string | undefined
) {
  const { metronomeEnabled, metronomeVolume } = useMetronomePreferences();
  const scheduler = useRef<ReturnType<typeof createMetronome> | null>(null);
  const volume = useRef(metronomeVolume);
  volume.current = metronomeVolume;
  useEffect(() => {
    const media = audio.current;
    if (!metronomeEnabled || !media || !source) return;
    const context = new AudioContext({ latencyHint: "interactive" });
    const metronome = createMetronome(media, context, lines, volume.current);
    scheduler.current = metronome;
    return () => {
      scheduler.current = null;
      metronome.dispose();
      void context.close();
    };
  }, [audio, lines, metronomeEnabled, source]);
  useEffect(() => {
    scheduler.current?.setVolume(metronomeVolume);
  }, [metronomeVolume]);
}
