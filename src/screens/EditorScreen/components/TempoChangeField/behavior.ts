import { useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";
import { MINIMUM_BPM, MAXIMUM_BPM } from "../../../../util/editor/constants";
export interface TempoChangeFieldProps {
  value: number;
  onChange: (value: number) => void;
}
export function useTempoChangeField({
  value,
  onChange,
}: TempoChangeFieldProps) {
  const { t } = useTranslation();
  const [state, setState] = useRecursiveState({ input: String(value) });
  useEffect(() => {
    setState({ input: String(value) });
  }, [value, setState]);
  return {
    input: state.input,
    label: t("editor.tempoChangeValue"),
    min: MINIMUM_BPM,
    max: MAXIMUM_BPM,
    onInput: (event: ChangeEvent<HTMLInputElement>) =>
      setState({ input: event.target.value }),
    onBlur: () => {
      const parsed = Number(state.input);
      const next =
        state.input.trim() && Number.isFinite(parsed)
          ? Math.round(
              Math.max(MINIMUM_BPM, Math.min(MAXIMUM_BPM, parsed)) * 100
            ) / 100
          : value;
      setState({ input: String(next) });
      if (next !== value) onChange(next);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.key === "Enter") event.currentTarget.blur();
    },
  };
}
