import {
  Download,
  Film,
  Monitor,
  Settings2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { type ChangeEvent } from "react";
import {
  Actions,
  AdvancedOptions,
  CancelButton,
  CloseButton,
  Dialog,
  DialogHeader,
  DialogIcon,
  DialogSubtitle,
  DialogTitle,
  Field,
  FieldIcon,
  GeneralOptions,
  HeaderCopy,
  Mixer,
  Overlay,
  PrimaryButton,
  SectionHeader,
} from "./styles";

export interface ExportDialogProps {
  title: string;
  description: string;
  advancedOptionsLabel: string;
  resolutionLabel: string;
  fpsLabel: string;
  audioLabel: string;
  encodingPresetLabel: string;
  encodingPresetNotice: string;
  instrumentalLabel: string;
  vocalsLabel: string;
  mixLabel: string;
  vocalsOnlyLabel: string;
  instrumentalOnlyLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
  resolution: "480p" | "720p" | "1080p" | "1440p";
  fps: 30 | 60;
  audioMode: "mix" | "vocals" | "instrumental";
  instrumentalVolume: number;
  vocalsVolume: number;
  encodingPreset:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow";
  onResolutionChange: (resolution: "480p" | "720p" | "1080p" | "1440p") => void;
  onFpsChange: (fps: 30 | 60) => void;
  onAudioModeChange: (mode: "mix" | "vocals" | "instrumental") => void;
  onInstrumentalVolumeChange: (volume: number) => void;
  onVocalsVolumeChange: (volume: number) => void;
  onEncodingPresetChange: (preset: ExportDialogProps["encodingPreset"]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExportDialog(props: ExportDialogProps) {
  const onDialogMouseDown = (event: React.MouseEvent<HTMLElement>) =>
    event.stopPropagation();
  const rangeValue = (event: ChangeEvent<HTMLInputElement>) =>
    Number(event.target.value);

  return (
    <Overlay role="presentation" onMouseDown={props.onCancel}>
      <Dialog role="dialog" aria-modal="true" onMouseDown={onDialogMouseDown}>
        <DialogHeader>
          <DialogIcon>
            <Upload size={25} />
          </DialogIcon>
          <HeaderCopy>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogSubtitle>{props.description}</DialogSubtitle>
          </HeaderCopy>
          <CloseButton
            type="button"
            aria-label={props.closeLabel}
            onClick={props.onCancel}
          >
            <X size={24} />
          </CloseButton>
        </DialogHeader>
        <GeneralOptions>
          <Field className="export-general-field">
            <FieldIcon>
              <Monitor size={22} />
            </FieldIcon>
            <span>{props.resolutionLabel}</span>
            <select
              value={props.resolution}
              onChange={(event) =>
                props.onResolutionChange(
                  event.target.value as ExportDialogProps["resolution"]
                )
              }
            >
              <option value="480p">480p · 854×480</option>
              <option value="720p">720p · 1280×720</option>
              <option value="1080p">1080p · 1920×1080</option>
              <option value="1440p">1440p · 2560×1440</option>
            </select>
          </Field>
          <Field className="export-general-field">
            <FieldIcon>
              <Film size={22} />
            </FieldIcon>
            <span>{props.fpsLabel}</span>
            <select
              value={props.fps}
              onChange={(event) =>
                props.onFpsChange(Number(event.target.value) as 30 | 60)
              }
            >
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </Field>
          <Field className="export-general-field">
            <FieldIcon>
              <Volume2 size={22} />
            </FieldIcon>
            <span>{props.audioLabel}</span>
            <select
              value={props.audioMode}
              onChange={(event) =>
                props.onAudioModeChange(
                  event.target.value as ExportDialogProps["audioMode"]
                )
              }
            >
              <option value="instrumental">
                {props.instrumentalOnlyLabel}
              </option>
              <option value="mix">{props.mixLabel}</option>
              <option value="vocals">{props.vocalsOnlyLabel}</option>
            </select>
          </Field>
        </GeneralOptions>
        {props.audioMode === "mix" ? (
          <Mixer>
            <SectionHeader>
              <Volume2 size={22} />
              <span>{props.audioLabel}</span>
            </SectionHeader>
            <Field className="export-mixer-control">
              <span>
                {props.instrumentalLabel}:{" "}
                {Math.round(props.instrumentalVolume * 100)}%
              </span>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={props.instrumentalVolume}
                  onChange={(event) =>
                    props.onInstrumentalVolumeChange(rangeValue(event))
                  }
                />
                <output>{Math.round(props.instrumentalVolume * 100)}%</output>
              </div>
            </Field>
            <Field className="export-mixer-control">
              <span>
                {props.vocalsLabel}: {Math.round(props.vocalsVolume * 100)}%
              </span>
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={props.vocalsVolume}
                  onChange={(event) =>
                    props.onVocalsVolumeChange(rangeValue(event))
                  }
                />
                <output>{Math.round(props.vocalsVolume * 100)}%</output>
              </div>
            </Field>
          </Mixer>
        ) : null}
        <AdvancedOptions>
          <SectionHeader className="export-advanced-title">
            <Settings2 size={22} />
            <span>{props.advancedOptionsLabel}</span>
          </SectionHeader>
          <Field className="export-advanced-field">
            <span>{props.encodingPresetLabel}</span>
            <select
              value={props.encodingPreset}
              onChange={(event) =>
                props.onEncodingPresetChange(
                  event.target.value as ExportDialogProps["encodingPreset"]
                )
              }
            >
              <option value="ultrafast">Ultrafast</option>
              <option value="superfast">Superfast</option>
              <option value="veryfast">Veryfast</option>
              <option value="faster">Faster</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium</option>
              <option value="slow">Slow</option>
            </select>
            <small>{props.encodingPresetNotice}</small>
          </Field>
        </AdvancedOptions>
        <Actions>
          <CancelButton type="button" onClick={props.onCancel}>
            {props.cancelLabel}
          </CancelButton>
          <PrimaryButton type="button" onClick={props.onConfirm}>
            <Download size={15} />
            {props.confirmLabel}
          </PrimaryButton>
        </Actions>
      </Dialog>
    </Overlay>
  );
}
