import { memo } from "react";
import { Mic2, Volume2 } from "lucide-react";
import { InlineMixer, InlineMixerChannel } from "../../styles";
import { useBehavior } from "./behavior";

function MixerPanelView() {
  const behavior = useBehavior({});

  return (
    <InlineMixer aria-label={behavior.mixerLabel}>
      <InlineMixerChannel>
        <Volume2 size={15} aria-hidden="true" />
        <input
          aria-label={behavior.instrumentalVolumeLabel}
          type="range"
          min="0"
          max="100"
          value={behavior.instrumentalVolume}
          onChange={behavior.onInstrumentalVolumeChange}
        />
        <output>{behavior.instrumentalVolume}%</output>
      </InlineMixerChannel>
      <InlineMixerChannel>
        <Mic2 size={15} aria-hidden="true" />
        <input
          aria-label={behavior.vocalsVolumeLabel}
          type="range"
          min="0"
          max="100"
          value={behavior.vocalsVolume}
          onChange={behavior.onVocalsVolumeChange}
        />
        <output>{behavior.vocalsVolume}%</output>
      </InlineMixerChannel>
    </InlineMixer>
  );
}

export const MixerPanel = memo(MixerPanelView);
MixerPanel.displayName = "MixerPanel";
