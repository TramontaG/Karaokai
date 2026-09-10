import type { ChangeEvent, KeyboardEvent } from "react";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";

export interface ColorInputProps {
  color: string;
  label: string;
  onChange: (color: string) => void;
  onPreviewChange?: (color: string) => void;
  onPreviewEnd?: () => void;
}

function normalizeHexColor(value: string) {
  const compact = value.trim();
  const shorthand = /^#([\da-f]{3})$/i.exec(compact);

  if (shorthand) {
    return `#${shorthand[1]
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`.toUpperCase();
  }

  return /^#[\da-f]{6}$/i.test(compact) ? compact.toUpperCase() : null;
}

export function useBehavior({
  color,
  label,
  onChange,
  onPreviewChange,
  onPreviewEnd,
}: ColorInputProps) {
  const [state, setState] = useRecursiveState<{ draft: string | null }>({
    draft: null,
  });
  const draft = state.draft;
  const setDraft = (draft: string | null) => setState({ draft });
  const value = draft ?? color;

  const commit = () => {
    const normalizedColor = normalizeHexColor(value);

    if (normalizedColor && normalizedColor !== color) {
      onChange(normalizedColor);
    }

    onPreviewEnd?.();
    setDraft(null);
  };

  const updateDraft = (nextValue: string) => {
    setDraft(nextValue);
    const normalizedColor = normalizeHexColor(nextValue);
    if (normalizedColor) onPreviewChange?.(normalizedColor);
  };

  return {
    value,
    label,
    colorValue: normalizeHexColor(value) ?? color,
    textLabel: `${label} hexadecimal`,
    commit,
    onColorChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateDraft(event.target.value.toUpperCase()),
    onTextChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateDraft(event.target.value),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") {
        setDraft(null);
        onPreviewEnd?.();
        event.currentTarget.blur();
      }
    },
  };
}
