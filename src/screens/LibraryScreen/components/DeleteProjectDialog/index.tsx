import { Render } from "../../../../components/Render";
import { useBehavior, type DeleteProjectDialogProps } from "./behavior";
import { Actions, Dialog, ErrorMessage } from "./styles";

export function DeleteProjectDialog(props: DeleteProjectDialogProps) {
  const behavior = useBehavior(props);
  return (
    <Dialog
      ref={behavior.dialogRef}
      aria-labelledby={behavior.titleId}
      aria-describedby={behavior.descriptionId}
      aria-busy={behavior.busy}
      onCancel={behavior.onDialogCancel}
    >
      <h2 id={behavior.titleId}>{behavior.title}</h2>
      <p id={behavior.descriptionId}>{behavior.description}</p>
      <Render when={behavior.error !== null}>
        <ErrorMessage role="alert">{behavior.error}</ErrorMessage>
      </Render>
      <Actions>
        <button
          type="button"
          autoFocus
          disabled={behavior.busy}
          onClick={behavior.onCancel}
        >
          {behavior.cancelLabel}
        </button>
        <button
          type="button"
          data-destructive="true"
          disabled={behavior.busy}
          onClick={behavior.onConfirm}
        >
          {behavior.confirmLabel}
        </button>
      </Actions>
    </Dialog>
  );
}
