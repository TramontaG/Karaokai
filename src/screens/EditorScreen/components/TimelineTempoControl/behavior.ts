import { useId, useRef } from "react";
import type { EditorTimelineModel } from "../../../../hooks/editor/componentModels";

export interface TimelineTempoControlProps {
  model: EditorTimelineModel;
}

export function useTimelineTempoControl({ model }: TimelineTempoControlProps) {
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const label = `${model.bpmLabel} / ${model.beatOffsetLabel}`;
  const positionPopover = () => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;
    const bounds = button.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 16);
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
    // Open above the timeline when there is room; otherwise below the button.
    const above = bounds.top >= 150;
    popover.style.top = above ? "auto" : `${bounds.bottom + 8}px`;
    popover.style.bottom = above
      ? `${window.innerHeight - bounds.top + 8}px`
      : "auto";
  };
  return { popoverId, buttonRef, popoverRef, label, positionPopover };
}
