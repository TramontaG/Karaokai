import { useEffect, useId, useRef, type SyntheticEvent } from "react";

export interface DeleteProjectDialogProps {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useBehavior(props: DeleteProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current!;
    // HTML dialog stays in the renderer: no Electron/GTK confirmation window.
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);
  const onDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!props.busy) props.onCancel();
  };
  return { ...props, dialogRef, titleId, descriptionId, onDialogCancel };
}
