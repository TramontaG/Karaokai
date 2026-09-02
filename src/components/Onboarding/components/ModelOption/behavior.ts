import { useCallback } from "react";
import { type ModelOptionProps } from ".";

export function useBehavior(props: ModelOptionProps) {
  const select = useCallback(() => props.onSelect(props.model.id), [props]);
  return {
    name: props.model.name,
    selected: props.model.selected,
    sizeLabel: props.model.sizeLabel,
    select,
  };
}
