import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { TrackLabelProps } from ".";

export function useBehavior(props: TrackLabelProps) {
  const editor = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.label);

  useEffect(() => {
    if (!editing) setDraft(props.label);
  }, [editing, props.label]);
  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const onSelect = useCallback(
    () => editor.onSelectTrack(props.id),
    [editor, props.id]
  );
  const onStartEditing = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      editor.onSelectTrack(props.id);
      setDraft(props.label);
      setEditing(true);
    },
    [editor, props.id, props.label]
  );
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    []
  );
  const onCommit = useCallback(() => {
    const name = draft.trim();
    if (name && name !== props.label) editor.onRenameTrack(props.id, name);
    setEditing(false);
  }, [draft, editor, props.id, props.label]);
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") {
        setDraft(props.label);
        setEditing(false);
      }
    },
    [props.label]
  );

  return {
    draft,
    editing,
    inputRef,
    onChange,
    onCommit,
    onKeyDown,
    onSelect,
    onStartEditing,
  };
}
