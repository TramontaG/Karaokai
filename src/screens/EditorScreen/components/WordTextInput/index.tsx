import { useBehavior, type WordTextInputProps } from "./behavior";

export function WordTextInput(props: WordTextInputProps) {
  const behavior = useBehavior(props);
  return (
    <input
      data-word-text-input
      aria-label={behavior.label}
      disabled={behavior.disabled}
      placeholder={behavior.placeholder}
      value={behavior.draft}
      onFocus={behavior.onFocus}
      onChange={(event) => behavior.onChange(event.target.value)}
      onBlur={behavior.onBlur}
      onKeyDown={behavior.onKeyDown}
    />
  );
}
