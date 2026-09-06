import { useCallback, useEffect, type MouseEvent } from "react";
import { type DeleteTrackDialogProps } from ".";

export function useBehavior(props: DeleteTrackDialogProps) {
  const onDialogMouseDown = useCallback(
    (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    []
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      props.onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.onCancel]);

  return {
    ...props,
    onDialogMouseDown,
  };
}
