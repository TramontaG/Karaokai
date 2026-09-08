import { useBehavior, type PhraseTextInputProps } from "./behavior";

export function PhraseTextInput(props: PhraseTextInputProps) {
  const behavior = useBehavior(props);
  return (
    <textarea
      value={behavior.draft}
      onChange={(event) => behavior.onChange(event.target.value)}
      onBlur={behavior.onBlur}
      onKeyDown={behavior.onKeyDown}
    />
  );
}
