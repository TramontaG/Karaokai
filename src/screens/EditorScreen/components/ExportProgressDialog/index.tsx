import type { LucideIcon } from "lucide-react";
import { Render } from "../../../../components/Render";
import {
  CancelButton,
  Dialog,
  DialogHeader,
  DialogIcon,
  DialogTitle,
  HeaderCopy,
  Overlay,
} from "../ExportDialog/styles";
import { ProgressBar, ProgressBody, ProgressValue } from "./styles";

export interface ExportProgressDialogProps {
  Icon: LucideIcon;
  status: "rendering" | "completed" | "failed";
  title: string;
  progress: number;
  error?: string;
  cancelling: boolean;
  cancelLabel: string;
  closeLabel: string;
  onCancel: () => void;
}

export function ExportProgressDialog(props: ExportProgressDialogProps) {
  return (
    <Overlay role="presentation">
      <Dialog role="dialog" aria-modal="true" aria-live="polite" data-progress>
        <DialogHeader>
          <DialogIcon data-rendering={props.status === "rendering"}>
            <props.Icon aria-hidden="true" size={25} />
          </DialogIcon>
          <HeaderCopy>
            <DialogTitle>{props.title}</DialogTitle>
          </HeaderCopy>
        </DialogHeader>
        <ProgressBody aria-busy={props.status === "rendering"}>
          <ProgressValue>{props.progress}%</ProgressValue>
          <ProgressBar $progress={props.progress} />
          <Render when={props.error !== undefined}>
            <small>{props.error}</small>
          </Render>
        </ProgressBody>
        <Render when={props.status === "rendering"}>
          <CancelButton
            type="button"
            disabled={props.cancelling}
            onClick={props.onCancel}
          >
            {props.cancelLabel}
          </CancelButton>
        </Render>
        <Render when={props.status !== "rendering"}>
          <CancelButton type="button" onClick={props.onCancel}>
            {props.closeLabel}
          </CancelButton>
        </Render>
      </Dialog>
    </Overlay>
  );
}
