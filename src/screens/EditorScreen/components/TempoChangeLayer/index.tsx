import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { TempoChangeMarker } from "../TempoChangeMarker";
import { useTempoChangeLayer, type TempoChangeLayerProps } from "./behavior";
import { Placement, Preview, Hint } from "../TimeSignatureLayer/styles";
export function TempoChangeLayer(props: TempoChangeLayerProps) {
  const behavior = useTempoChangeLayer(props);
  return (
    <>
      <ForEach
        data={behavior.markers}
        idCompute={behavior.markerId}
        render={(marker) => (
          <TempoChangeMarker marker={marker} model={props.model} />
        )}
      />
      <Render when={behavior.placing}>
        <Placement
          data-tempo-change-placement="true"
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
