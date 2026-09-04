import {
  Copy,
  FolderOpen,
  Pencil,
  Play,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { Menu, MenuItem, MenuSeparator } from "./styles";

export interface ProjectActionsMenuProps {
  label: string;
  openLabel: string;
  renameLabel: string;
  favoriteLabel: string;
  duplicateLabel: string;
  exportLabel: string;
  openFolderLabel: string;
  deleteLabel: string;
  onOpen: () => void;
  onRename: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onOpenFolder: () => void;
  onDelete: () => void;
}

export function ProjectActionsMenu(props: ProjectActionsMenuProps) {
  return (
    <Menu role="menu" aria-label={props.label}>
      <MenuItem type="button" role="menuitem" onClick={props.onOpen}>
        <Play aria-hidden="true" size={16} />
        {props.openLabel}
      </MenuItem>
      <MenuItem type="button" role="menuitem" onClick={props.onRename}>
        <Pencil aria-hidden="true" size={16} />
        {props.renameLabel}
      </MenuItem>
      <MenuItem type="button" role="menuitem" onClick={props.onToggleFavorite}>
        <Star aria-hidden="true" size={16} />
        {props.favoriteLabel}
      </MenuItem>
      <MenuSeparator />
      <MenuItem type="button" role="menuitem" onClick={props.onDuplicate}>
        <Copy aria-hidden="true" size={16} />
        {props.duplicateLabel}
      </MenuItem>
      <MenuItem type="button" role="menuitem" onClick={props.onExport}>
        <Share2 aria-hidden="true" size={16} />
        {props.exportLabel}
      </MenuItem>
      <MenuItem type="button" role="menuitem" onClick={props.onOpenFolder}>
        <FolderOpen aria-hidden="true" size={16} />
        {props.openFolderLabel}
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        type="button"
        role="menuitem"
        data-variant="danger"
        onClick={props.onDelete}
      >
        <Trash2 aria-hidden="true" size={16} />
        {props.deleteLabel}
      </MenuItem>
    </Menu>
  );
}
