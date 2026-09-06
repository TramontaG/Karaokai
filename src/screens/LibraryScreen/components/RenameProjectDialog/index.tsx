import { useBehavior, type RenameProjectDialogProps } from "./behavior";
import { Actions, Backdrop, Dialog } from "./styles";

export function RenameProjectDialog(props: RenameProjectDialogProps) {
  const behavior = useBehavior(props);

  return (
    <Backdrop>
      <Dialog onSubmit={behavior.onSubmit}>
        <h2>{behavior.title}</h2>
        <label>
          {behavior.fieldLabel}
          <input
            autoFocus
            value={behavior.name}
            onChange={behavior.onNameChange}
          />
        </label>
        <Actions>
          <button type="button" onClick={behavior.onCancel}>
            {behavior.cancelLabel}
          </button>
          <button type="submit">{behavior.confirmLabel}</button>
        </Actions>
      </Dialog>
    </Backdrop>
  );
}
