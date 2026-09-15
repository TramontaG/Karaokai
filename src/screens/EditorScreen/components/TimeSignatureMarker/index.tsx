import { Pencil, Trash2 } from "lucide-react";
import { TimeSignatureFields } from "../TimeSignatureFields";
import {
  useTimeSignatureMarker,
  type TimeSignatureMarkerProps,
} from "./behavior";
import { Marker, Actions, EditPopover } from "./styles";
export function TimeSignatureMarker(props: TimeSignatureMarkerProps) {
  const behavior = useTimeSignatureMarker(props);
  return (
    <Marker style={behavior.style} data-time-signature-marker={props.marker.id}>
      <Actions
        $alignEnd={behavior.alignEnd}
        onClick={behavior.stop}
        onPointerDown={behavior.stop}
      >
        <button
          type="button"
          title={behavior.moveLabel}
          aria-label={behavior.moveLabel}
          onPointerDown={behavior.onPointerDown}
          onPointerMove={behavior.onPointerMove}
          onPointerUp={behavior.onPointerUp}
          onPointerCancel={behavior.onPointerCancel}
          onKeyDown={behavior.onMoveKey}
        >
          {behavior.label}
        </button>
        <button
          type="button"
          title={behavior.editLabel}
          aria-label={behavior.editLabel}
          popoverTarget={behavior.popoverId}
          onClick={behavior.onEdit}
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          title={behavior.deleteLabel}
          aria-label={behavior.deleteLabel}
          onClick={behavior.onDelete}
        >
          <Trash2 size={11} />
        </button>
      </Actions>
      <EditPopover
        ref={behavior.popover}
        id={behavior.popoverId}
        popover="auto"
        onClick={behavior.stop}
        onPointerDown={behavior.stop}
      >
        <span>{behavior.editLabel}</span>
        <TimeSignatureFields
          value={props.marker}
          onChange={behavior.onChange}
        />
      </EditPopover>
    </Marker>
  );
}
