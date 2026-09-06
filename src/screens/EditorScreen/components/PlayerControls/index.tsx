import { memo } from "react";
import { Maximize, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Render } from "../../../../components/Render";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  PlayerBar,
  PlayerControls as Controls,
  PlayerSeek,
  PlayerTools,
  Time,
} from "../../styles";

function PlayerControlsView() {
  useEditorState((behavior) => behavior.currentTime);
  const behavior = useEditorBehavior();
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
        <Maximize size={17} />
      </PlayerTools>
    </PlayerBar>
  );
}

export const PlayerControls = memo(PlayerControlsView);
PlayerControls.displayName = "PlayerControls";
