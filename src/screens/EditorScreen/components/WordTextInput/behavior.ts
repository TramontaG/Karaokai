import { useCallback, useEffect, useState, type KeyboardEvent } from "react";

export interface WordTextInputProps {
  value: string;
  label: string;
  placeholder?: string;
  disabled: boolean;
  onFocus: () => void;
  onCommit: (value: string) => void;
}

export function useBehavior(props: WordTextInputProps) {
  const [draft, setDraft] = useState(props.value);

  useEffect(() => setDraft(props.value), [props.value]);

  const onBlur = useCallback(() => {
    const next = draft.trim();
    if (next !== props.value || /\s/.test(next)) props.onCommit(next);
  }, [draft, props]);
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Tab") {
        const inputs = Array.from(
          document.querySelectorAll<HTMLInputElement>("[data-word-text-input]")
        );
        const nextInput =
          inputs[
            inputs.indexOf(event.currentTarget) + (event.shiftKey ? -1 : 1)
          ];

        if (nextInput) {
          event.preventDefault();
          nextInput.focus();
        }
        return;
      }

      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") {
        setDraft(props.value);
        event.currentTarget.blur();
      }
    },
    [props.value]
  );

  return {
    ...props,
    draft,
    onBlur,
    onChange: setDraft,
    onKeyDown,
  };
}
