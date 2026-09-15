import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { TimeSignatureMarker } from "../TimeSignatureMarker";
import {
  useTimeSignatureLayer,
  type TimeSignatureLayerProps,
} from "./behavior";
import { Placement, Preview, Hint } from "./styles";
export function TimeSignatureLayer(props: TimeSignatureLayerProps) {
  const behavior = useTimeSignatureLayer(props);
  return (
    <>
      <ForEach
        data={behavior.markers}
        idCompute={behavior.markerId}
        render={(marker) => (
          <TimeSignatureMarker marker={marker} model={props.model} />
        )}
      />
      <Render when={behavior.placing}>
        <Placement
          data-time-signature-placement="true"
          onMouseMove={behavior.onMove}
          onMouseLeave={behavior.onLeave}
          onClick={behavior.onPlace}
          onPointerDown={behavior.stop}
        >
          <Hint role="status">
            {behavior.hint}
            <button type="button" onClick={behavior.cancel}>
              {behavior.cancelLabel}
            </button>
          </Hint>
          <Render when={behavior.showPreview}>
            <Preview style={behavior.previewStyle}>
              <span>{behavior.label}</span>
            </Preview>
          </Render>
        </Placement>
      </Render>
    </>
  );
}
