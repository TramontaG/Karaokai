import { useCallback, type MouseEvent } from "react";
import { type DetailsModalProps } from ".";

export function useBehavior(props: DetailsModalProps) {
  const onDialogMouseDown = useCallback(
    (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    []
  );

  return {
    ...props,
    onDialogMouseDown,
  };
}
