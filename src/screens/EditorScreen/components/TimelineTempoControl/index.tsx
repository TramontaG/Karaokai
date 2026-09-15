import { TempoChangeField } from "../TempoChangeField";
import { TimeSignatureFields } from "../TimeSignatureFields";
import { Render } from "../../../../components/Render";
import { Gauge, Timer, Volume2, X } from "lucide-react";
import { TimelineTempoField, TimelineToolButton } from "../../styles";
import {
  useTimelineTempoControl,
  type TimelineTempoControlProps,
} from "./behavior";
import {
  TempoPopover,
  PopoverHeader,
  TempoFields,
  MetronomeRow,
  MetronomeToggle,
  EventsLabel,
  SectionTabs,
  SectionButton,
  TabPanel,
  TempoChangePanel,
  PrimaryButton,
} from "./styles";

export function TimelineTempoControl(props: TimelineTempoControlProps) {
  const behavior = useTimelineTempoControl(props);
  return (
    <>
      <TimelineToolButton
        ref={behavior.buttonRef}
        type="button"
        $active={false}
        popoverTarget={behavior.popoverId}
        title={behavior.label}
        aria-label={behavior.label}
        onClick={behavior.positionPopover}
      >
        <Gauge size={14} />
      </TimelineToolButton>
      <TempoPopover
        ref={behavior.popoverRef}
        id={behavior.popoverId}
        popover="auto"
        aria-label={behavior.label}
      >
        <PopoverHeader>
          <strong>{behavior.label}</strong>
          <button
            type="button"
            popoverTarget={behavior.popoverId}
            popoverTargetAction="hide"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </PopoverHeader>
        <TempoFields>
          <TimelineTempoField>
            <span>{props.model.bpmLabel}</span>
            <input
              type="number"
              min="20"
              max="400"
              step="0.1"
              value={props.model.bpmInputValue}
              onChange={props.model.onBpmInput}
              onBlur={props.model.onBpmBlur}
              onKeyDown={props.model.onBpmKeyDown}
            />
          </TimelineTempoField>
          <TimelineTempoField>
            <span>{props.model.beatOffsetLabel}</span>
            <input
              type="number"
              min="0"
              max={props.model.maximumTempoOffsetSeconds}
              step="0.01"
              value={props.model.tempoOffsetSeconds}
              onChange={props.model.onBeatOffsetInput}
            />
          </TimelineTempoField>
        </TempoFields>
        <MetronomeRow>
          <MetronomeToggle title={behavior.metronomeLabel}>
            <input
              type="checkbox"
              checked={behavior.metronomeEnabled}
              onChange={behavior.onMetronomeChange}
              aria-label={behavior.metronomeLabel}
            />
            <Timer size={16} aria-hidden="true" />
            <span>{behavior.metronomeLabel}</span>
          </MetronomeToggle>
          <Render when={behavior.metronomeEnabled}>
            <Volume2 size={20} aria-hidden="true" />
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={behavior.metronomeVolume}
              onChange={behavior.onVolumeChange}
              aria-label={behavior.metronomeVolumeLabel}
              title={behavior.metronomeVolumeLabel}
            />
          </Render>
        </MetronomeRow>
        <EventsLabel>{behavior.eventsLabel}</EventsLabel>
        <SectionTabs
          $activeTab={behavior.tempoOpen ? "tempo" : "signature"}
          $visible={behavior.signatureOpen || behavior.tempoOpen}
        >
          <SectionButton
            type="button"
            active={behavior.signatureOpen}
            aria-expanded={behavior.signatureOpen}
            onClick={behavior.toggleSignature}
          >
            {behavior.signatureLabel}
          </SectionButton>
          <SectionButton
            type="button"
            active={behavior.tempoOpen}
            aria-expanded={behavior.tempoOpen}
            onClick={behavior.toggleTempo}
          >
            {behavior.tempoChangeLabel}
          </SectionButton>
        </SectionTabs>
        <TabPanel>
          <Render when={behavior.signatureOpen}>
            <TimeSignatureFields
              value={props.model.timeSignatures}
              onChange={props.model.timeSignatures.setDraft}
            />
            <PrimaryButton
              type="button"
              disabled={props.model.timeSignatures.disabled}
              onClick={behavior.markSignature}
            >
              {behavior.markLabel}
            </PrimaryButton>
          </Render>
          <Render when={behavior.tempoOpen}>
            <TempoChangePanel>
              <TempoChangeField
                value={props.model.tempoChanges.bpm}
                onChange={props.model.tempoChanges.setDraft}
              />
            </TempoChangePanel>
            <PrimaryButton
              type="button"
              disabled={props.model.tempoChanges.disabled}
              onClick={behavior.markTempo}
            >
              {behavior.markLabel}
            </PrimaryButton>
          </Render>
        </TabPanel>
      </TempoPopover>
    </>
  );
}
