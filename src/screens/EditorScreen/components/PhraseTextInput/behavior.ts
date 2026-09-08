import { useCallback, useEffect, useState, type KeyboardEvent } from "react";

export interface PhraseTextInputProps {
  phraseId: string;
  value: string;
  onCommit: (value: string) => void;
}

export function useBehavior(props: PhraseTextInputProps) {
  const [draft, setDraft] = useState(props.value);

  useEffect(() => setDraft(props.value), [props.phraseId, props.value]);

  const onBlur = useCallback(() => {
    if (draft !== props.value) props.onCommit(draft);
  }, [draft, props]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  }, []);

  return {
    ...props,
    draft,
    onBlur,
    onChange: setDraft,
    onKeyDown,
  };
}
