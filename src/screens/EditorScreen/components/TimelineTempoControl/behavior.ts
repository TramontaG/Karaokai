import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useMetronomePreferences } from "../../../../hooks/useMetronomePreferences";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type ChangeEvent, useId, useRef } from "react";
import type { EditorTimelineModel } from "../../../../hooks/editor/componentModels";

export interface TimelineTempoControlProps {
  model: EditorTimelineModel;
}

export function useTimelineTempoControl({ model }: TimelineTempoControlProps) {
  const { t } = useTranslation();
  const [state, setState] = useRecursiveState({
    signatureOpen: true,
    tempoOpen: false,
  });

  const preferences = useMetronomePreferences();
  const onMetronomeChange = (event: ChangeEvent<HTMLInputElement>) =>
    preferences.setMetronomeEnabled(event.target.checked);
  const onVolumeChange = (event: ChangeEvent<HTMLInputElement>) =>
    preferences.setMetronomeVolume(Number(event.target.value));
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const label = `${model.bpmLabel} / ${model.beatOffsetLabel}`;

  const positionPopover = () => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;
    const bounds = button.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 16);
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
    // Open above the timeline when there is room; otherwise below the button.
    const above = bounds.top >= 350;
    popover.style.top = above ? "auto" : `${bounds.bottom + 8}px`;
    popover.style.bottom = above
      ? `${window.innerHeight - bounds.top + 8}px`
      : "auto";
  };

  return {
    signatureOpen: state.signatureOpen,
    eventsLabel: t("editor.timelineTempoEvents"),
    signatureLabel: t("editor.timeSignatureChange"),
    markLabel: t("editor.timeSignatureMark"),
    toggleSignature: () => setState({ signatureOpen: true, tempoOpen: false }),
    tempoOpen: state.tempoOpen,
    tempoChangeLabel: t("editor.tempoChange"),
    toggleTempo: () => setState({ tempoOpen: true, signatureOpen: false }),
    markTempo: () => {
      model.timeSignatures.cancel();
      model.tempoChanges.begin();
      popoverRef.current?.hidePopover();
    },
    markSignature: () => {
      model.tempoChanges.cancel();
      model.timeSignatures.begin();
      popoverRef.current?.hidePopover();
    },
    ...preferences,
    onMetronomeChange,
    onVolumeChange,
    metronomeLabel: t("editor.metronome"),
    metronomeVolumeLabel: t("editor.metronomeVolume"),
    popoverId,
    buttonRef,
    popoverRef,
    label,
    positionPopover,
  };
}
