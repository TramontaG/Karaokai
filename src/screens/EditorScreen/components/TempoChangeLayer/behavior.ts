import { type MouseEvent } from "react";
import type { TempoChangeMarker } from "../../../../domain/project";
import type { TempoChangesModel } from "../../../../hooks/editor/useTempoChanges";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";
export interface TempoChangeLayerProps {
  model: TempoChangesModel;
}
export function useTempoChangeLayer({ model }: TempoChangeLayerProps) {
  const { t } = useTranslation();
  const [state, setState] = useRecursiveState({ preview: 0, hovering: false });
  const preview = model.snap(state.preview);
  return {
    markers: model.markers,
    placing: model.placing,
    showPreview: model.placing && state.hovering,
    label: `${model.bpm} ${t("editor.bpm")}`,
    hint: t("editor.tempoChangePlacementHint"),
    cancelLabel: t("editor.timeSignatureCancel"),
    previewStyle: { left: `${(preview / Math.max(1, model.duration)) * 100}%` },
    markerId: (marker: TempoChangeMarker) => marker.id,
    onMove: (event: MouseEvent<HTMLDivElement>) =>
      setState({ hovering: true, preview: model.positionAt(event.clientX) }),
    onLeave: () => setState({ hovering: false }),
    onPlace: (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      model.place(model.positionAt(event.clientX));
    },
    stop: (event: MouseEvent) => event.stopPropagation(),
    cancel: (event: MouseEvent) => {
      event.stopPropagation();
      model.cancel();
    },
  };
}
