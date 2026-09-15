import { useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import type { TimeSignature } from "../../../../domain/project";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";

export interface TimeSignatureFieldsProps {
  value: TimeSignature;
  onChange: (signature: TimeSignature) => void;
}
export function useTimeSignatureFields({
  value,
  onChange,
}: TimeSignatureFieldsProps) {
  const { t } = useTranslation();
  const [state, setState] = useRecursiveState({
    numerator: String(value.numerator),
  });
  useEffect(() => {
    setState({ numerator: String(value.numerator) });
  }, [value.numerator, setState]);
  const commit = () => {
    const parsed = Number(state.numerator);
    const numerator =
      Number.isInteger(parsed) && parsed >= 1 && parsed <= 32
        ? parsed
        : value.numerator;
    setState({ numerator: String(numerator) });
    if (numerator !== value.numerator)
      onChange({ numerator, denominator: value.denominator });
  };
  const presets = [
    [2, 4],
    [3, 4],
    [4, 4],
    [6, 8],
    [12, 8],
  ].map(([numerator, denominator]) => ({
    label: `${numerator}/${denominator}`,
    active: numerator === value.numerator && denominator === value.denominator,
    onClick: () => onChange({ numerator, denominator }),
  }));

  const setDenominator = (number: number) => {
    onChange({ numerator: value.numerator, denominator: number });
  };

  return {
    numerator: state.numerator,
    denominator: value.denominator,
    presets,
    numeratorLabel: t("editor.timeSignatureNumerator"),
    denominatorLabel: t("editor.timeSignatureDenominator"),
    presetId: (preset: (typeof presets)[number]) => preset.label,
    onNumeratorChange: (event: ChangeEvent<HTMLInputElement>) =>
      setState({ numerator: event.target.value }),
    onNumeratorBlur: commit,
    onNumeratorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.key === "Enter") event.currentTarget.blur();
    },
    setDenominator,
  };
}
