import { AlertTriangle, Trash2, X } from "lucide-react";
import { useBehavior } from "./behavior";
import {
  Actions,
  CancelButton,
  CloseButton,
  ConfirmButton,
  Description,
  Dialog,
  Header,
  Icon,
  Overlay,
  Title,
} from "./styles";

export interface DeleteTrackDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTrackDialog(props: DeleteTrackDialogProps) {
  const behavior = useBehavior(props);

  return (
    <Overlay role="presentation" onMouseDown={behavior.onCancel}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-track-title"
        aria-describedby="delete-track-description"
        onMouseDown={behavior.onDialogMouseDown}
      >
        <Header>
          <Icon>
            <AlertTriangle aria-hidden="true" size={20} />
          </Icon>
          <Title id="delete-track-title">{behavior.title}</Title>
          <CloseButton
            type="button"
            aria-label={behavior.closeLabel}
            onClick={behavior.onCancel}
          >
            <X aria-hidden="true" size={18} />
          </CloseButton>
        </Header>
        <Description id="delete-track-description">
          {behavior.description}
        </Description>
        <Actions>
          <CancelButton type="button" autoFocus onClick={behavior.onCancel}>
            {behavior.cancelLabel}
          </CancelButton>
          <ConfirmButton type="button" onClick={behavior.onConfirm}>
            <Trash2 aria-hidden="true" size={15} />
            {behavior.confirmLabel}
          </ConfirmButton>
        </Actions>
      </Dialog>
    </Overlay>
  );
}
