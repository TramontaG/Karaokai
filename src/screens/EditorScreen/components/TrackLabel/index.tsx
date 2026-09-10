import type { LucideIcon } from "lucide-react";
import { Render } from "../../../../components/Render";
import { useBehavior } from "./behavior";
import { LabelButton, LabelEditor } from "./styles";

export interface TrackLabelProps {
  id: string;
  label: string;
  Icon: LucideIcon;
  selected: boolean;
  onSelectTrack: (id: string) => void;
  onRenameTrack: (id: string, name: string) => void;
}

export function TrackLabel(props: TrackLabelProps) {
  const behavior = useBehavior(props);
  return (
    <>
      <Render when={!behavior.editing}>
        <LabelButton
          type="button"
          $selected={props.selected}
          onClick={behavior.onSelect}
          onDoubleClick={behavior.onStartEditing}
          title={props.label}
        >
          <props.Icon size={15} aria-hidden="true" />
          <span>{props.label}</span>
        </LabelButton>
      </Render>
      <Render when={behavior.editing}>
        <LabelEditor $selected={props.selected}>
          <props.Icon size={15} aria-hidden="true" />
          <input
            ref={behavior.inputRef}
            value={behavior.draft}
            onChange={behavior.onChange}
            onBlur={behavior.onCommit}
            onKeyDown={behavior.onKeyDown}
          />
        </LabelEditor>
      </Render>
    </>
  );
}
