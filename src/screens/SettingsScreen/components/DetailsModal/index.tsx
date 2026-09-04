import { X } from "lucide-react";
import { type ReactNode } from "react";
import { useBehavior } from "./behavior";
import {
  CloseButton,
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
  Overlay,
} from "./styles";

export interface DetailsModalProps {
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
}

export function DetailsModal(props: DetailsModalProps) {
  const behavior = useBehavior(props);

  return (
    <Overlay role="presentation" onMouseDown={behavior.onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-label={behavior.title}
        onMouseDown={behavior.onDialogMouseDown}
      >
        <DialogHeader>
          <DialogTitle>{behavior.title}</DialogTitle>
          <CloseButton
            type="button"
            aria-label={behavior.closeLabel}
            onClick={behavior.onClose}
          >
            <X aria-hidden="true" size={18} />
          </CloseButton>
        </DialogHeader>
        <DialogBody>{behavior.children}</DialogBody>
      </Dialog>
    </Overlay>
  );
}
