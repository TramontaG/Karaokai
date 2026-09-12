import { Gauge } from "lucide-react";
import { TimelineTempoField, TimelineToolButton } from "../../styles";
import {
  useTimelineTempoControl,
  type TimelineTempoControlProps,
} from "./behavior";
import { TempoPopover } from "./styles";

export function TimelineTempoControl(props: TimelineTempoControlProps) {
  const behavior = useTimelineTempoControl(props);
  return (
    <>
      <TimelineToolButton
        ref={behavior.buttonRef}
        type="button"
        $active={false}
        popoverTarget={behavior.popoverId}
        title={behavior.label}
        aria-label={behavior.label}
        onClick={behavior.positionPopover}
      >
        <Gauge size={14} />
      </TimelineToolButton>
      <TempoPopover
        ref={behavior.popoverRef}
        id={behavior.popoverId}
        popover="auto"
        aria-label={behavior.label}
      >
        <TimelineTempoField>
          <span>{props.model.bpmLabel}</span>
          <input
            type="number"
            min="20"
            max="400"
            step="0.1"
            value={props.model.bpmInputValue}
            onChange={props.model.onBpmInput}
            onBlur={props.model.onBpmBlur}
            onKeyDown={props.model.onBpmKeyDown}
          />
        </TimelineTempoField>
        <TimelineTempoField>
          <span>{props.model.beatOffsetLabel}</span>
          <input
            type="number"
            min="0"
            max={props.model.maximumTempoOffsetSeconds}
            step="0.01"
            value={props.model.tempoOffsetSeconds}
            onChange={props.model.onBeatOffsetInput}
          />
        </TimelineTempoField>
      </TempoPopover>
    </>
  );
}
