import { ForEach } from "../../../../components/ForEach";
import {
  useTimeSignatureFields,
  type TimeSignatureFieldsProps,
} from "./behavior";
import { DenominatorButton, Fields, Line, Presets } from "./styles";
export function TimeSignatureFields(props: TimeSignatureFieldsProps) {
  const behavior = useTimeSignatureFields(props);
  return (
    <>
      <Fields>
        <input
          type="number"
          min="1"
          max="32"
          step="1"
          aria-label={behavior.numeratorLabel}
          value={behavior.numerator}
          onChange={behavior.onNumeratorChange}
          onBlur={behavior.onNumeratorBlur}
          onKeyDown={behavior.onNumeratorKeyDown}
        />
        <span aria-hidden="true">/</span>
        <ForEach
          data={[2, 4, 8, 16]}
          idCompute={(denominator) => String(denominator)}
          render={(denominator) => (
            <DenominatorButton
              type="button"
              aria-pressed={denominator === behavior.denominator}
              onClick={() => behavior.setDenominator(denominator)}
            >
              {denominator}
            </DenominatorButton>
          )}
        />
      </Fields>
      <Line />
      <Presets>
        <ForEach
          data={behavior.presets}
          idCompute={behavior.presetId}
          render={(preset) => (
            <button
              type="button"
              aria-pressed={preset.active}
              onClick={preset.onClick}
            >
              {preset.label}
            </button>
          )}
        />
      </Presets>
    </>
  );
}
