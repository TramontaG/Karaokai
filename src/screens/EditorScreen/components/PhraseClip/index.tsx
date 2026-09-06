import { memo } from "react";
import { ForEach } from "../../../../components/ForEach";
import {
  arePhraseClipPropsEqual,
  useBehavior,
  type PhraseClipProps,
} from "./behavior";
import { Clip, ClipEdge, Words } from "./styles";

function PhraseClipView(props: PhraseClipProps) {
  const behavior = useBehavior(props);
  return (
    <Clip
      type="button"
      $selected={behavior.selected}
      style={{ left: behavior.left, width: behavior.width }}
      onClick={behavior.onSelect}
      onDoubleClick={behavior.onDoubleClick}
      onPointerDown={behavior.onMoveStart}
    >
      <ClipEdge $side="start" onPointerDown={behavior.onStartResize} />
      <Words>
        <ForEach
          data={behavior.words}
          idCompute={behavior.getWordId}
          render={behavior.renderWord}
        />
      </Words>
      <ClipEdge $side="end" onPointerDown={behavior.onEndResize} />
    </Clip>
  );
}

export const PhraseClip = memo(PhraseClipView, arePhraseClipPropsEqual);
PhraseClip.displayName = "PhraseClip";
