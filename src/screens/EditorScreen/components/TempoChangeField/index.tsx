import { TimelineTempoField } from "../../styles";
import { useTempoChangeField, type TempoChangeFieldProps } from "./behavior";
export function TempoChangeField(props: TempoChangeFieldProps) {
  const behavior = useTempoChangeField(props);
  return (
    <TimelineTempoField>
      <span>{behavior.label}</span>
      <input
        type="number"
        min={behavior.min}
        max={behavior.max}
        step="0.1"
        aria-label={behavior.label}
        value={behavior.input}
        onChange={behavior.onInput}
        onBlur={behavior.onBlur}
        onKeyDown={behavior.onKeyDown}
      />
    </TimelineTempoField>
  );
}
