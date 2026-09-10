import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { memo } from "react";
import { Render } from "../../../../components/Render";
import type {
  MixerPanelModel,
  PlayerControlsModel,
} from "../../../../hooks/editor/componentModels";
import {
  PlayerControls as Controls,
  PlayerBar,
  PlayerSeek,
  PlayerTools,
  Time,
} from "../../styles";
import { MixerPanel } from "../MixerPanel";

function PlayerControlsView({
  model: behavior,
  mixer,
}: {
  model: PlayerControlsModel;
  mixer: MixerPanelModel;
}) {
  return (
    <PlayerBar>
      <PlayerSeek>
        <Time>{behavior.formattedCurrentTime}</Time>
        <input
          type="range"
          min="0"
          max={behavior.duration}
          value={behavior.currentTime}
          onChange={behavior.onSeekInput}
        />
      </PlayerSeek>
      <Controls>
        <button type="button" onClick={behavior.onSkipBack}>
          <SkipBack size={17} />
        </button>
        <button
          type="button"
          disabled={!behavior.isAudioReady}
          onClick={behavior.onTogglePlayback}
        >
          <Render when={behavior.isPlaying}>
            <Pause size={18} />
          </Render>
          <Render when={!behavior.isPlaying}>
            <Play size={18} />
          </Render>
        </button>
        <button type="button" onClick={behavior.onSkipForward}>
          <SkipForward size={17} />
        </button>
      </Controls>
      <PlayerTools>
        <MixerPanel model={mixer} />
      </PlayerTools>
    </PlayerBar>
  );
}

export const PlayerControls = memo(PlayerControlsView);
PlayerControls.displayName = "PlayerControls";
