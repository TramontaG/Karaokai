import {
  BadgeCheck,
  FolderOpen,
  Info,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { Render } from "../../../../components/Render";
import { Item, Menu, Separator } from "./styles";

export interface ActionMenuProps {
  label: string;
  isDependency: boolean;
  isModel: boolean;
  openFolderLabel: string;
  verifyLabel: string;
  updatesLabel: string;
  detailsLabel: string;
  defaultLabel: string;
  removeLabel: string;
  onOpenFolder: () => void;
  onVerify: () => void;
  onCheckUpdates: () => void;
  onDetails: () => void;
  onSetDefault: () => void;
  onRemove: () => void;
}

export function ActionMenu(props: ActionMenuProps) {
  return (
    <Menu role="menu" aria-label={props.label}>
      <Render when={props.isModel}>
        <Item type="button" role="menuitem" onClick={props.onSetDefault}>
          <Star aria-hidden="true" size={16} />
          {props.defaultLabel}
        </Item>
        <Item type="button" role="menuitem" onClick={props.onVerify}>
          <BadgeCheck aria-hidden="true" size={16} />
          {props.verifyLabel}
        </Item>
      </Render>
      <Render when={props.isDependency}>
        <Item type="button" role="menuitem" onClick={props.onOpenFolder}>
          <FolderOpen aria-hidden="true" size={16} />
          {props.openFolderLabel}
        </Item>
        <Item type="button" role="menuitem" onClick={props.onVerify}>
          <BadgeCheck aria-hidden="true" size={16} />
          {props.verifyLabel}
        </Item>
        <Item type="button" role="menuitem" onClick={props.onCheckUpdates}>
          <RefreshCw aria-hidden="true" size={16} />
          {props.updatesLabel}
        </Item>
      </Render>
      <Render when={props.isModel}>
        <Item type="button" role="menuitem" onClick={props.onOpenFolder}>
          <FolderOpen aria-hidden="true" size={16} />
          {props.openFolderLabel}
        </Item>
      </Render>
      <Item type="button" role="menuitem" onClick={props.onDetails}>
        <Info aria-hidden="true" size={16} />
        {props.detailsLabel}
      </Item>
      <Separator />
      <Item
        type="button"
        role="menuitem"
        data-variant="danger"
        onClick={props.onRemove}
      >
        <Trash2 aria-hidden="true" size={16} />
        {props.removeLabel}
      </Item>
    </Menu>
  );
}
