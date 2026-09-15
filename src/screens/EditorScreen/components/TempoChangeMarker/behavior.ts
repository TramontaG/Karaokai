import {
  useId,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import type { TempoChangeMarker } from "../../../../domain/project";
import type { TempoChangesModel } from "../../../../hooks/editor/useTempoChanges";
import {
  nearestGridTime,
  type TempoGridLine,
} from "../../../../util/editor/tempoGrid";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";
export interface TempoChangeMarkerProps {
  marker: TempoChangeMarker;
  model: TempoChangesModel;
}
export function useTempoChangeMarker({
  marker,
  model,
}: TempoChangeMarkerProps) {
  const { t } = useTranslation();
  const popoverId = useId();
  const popover = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    grid: TempoGridLine[];
    startX: number;
    time: number;
  } | null>(null);
  const [state, setState] = useRecursiveState<{ preview: number | null }>({
    preview: null,
  });
  const stop = (event: MouseEvent) => event.stopPropagation();
  const finish = (event: PointerEvent<HTMLButtonElement>, commit: boolean) => {
    event.stopPropagation();
    const gesture = drag.current;
    drag.current = null;
    setState({ preview: null });
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && gesture && Math.abs(event.clientX - gesture.startX) > 3)
      model.move(marker.id, gesture.time);
  };
  return {
    label: `${marker.bpm} ${t("editor.bpm")}`,
    alignEnd: (state.preview ?? marker.time) > model.duration * 0.85,
    style: {
      left: `${((state.preview ?? marker.time) / Math.max(1, model.duration)) * 100}%`,
    },
    popoverId,
    popover,
    moveLabel: t("editor.tempoChangeMove"),
    editLabel: t("editor.tempoChangeEdit"),
    deleteLabel: t("editor.tempoChangeDelete"),
    stop,
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      drag.current = {
        grid: model.gridWithout(marker.id),
        startX: event.clientX,
        time: marker.time,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      if (!drag.current) return;
      drag.current.time = nearestGridTime(
        drag.current.grid,
        marker.time +
          model.positionAt(event.clientX) -
          model.positionAt(drag.current.startX)
      );
      setState({ preview: drag.current.time });
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, true),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, false),
    onMoveKey: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Escape") {
        drag.current = null;
        setState({ preview: null });
      }
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const lines = model.gridWithout(marker.id);
      const next =
        event.key === "ArrowLeft"
          ? lines.filter((line) => line.time < marker.time - 1e-5).at(-1)
          : lines.find((line) => line.time > marker.time + 1e-5);
      if (next) model.move(marker.id, next.time);
    },
    onEdit: (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const bounds = event.currentTarget.getBoundingClientRect();
      if (!popover.current) return;
      popover.current.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - 268))}px`;
      popover.current.style.top = `${Math.max(8, Math.min(bounds.bottom + 8, window.innerHeight - 200))}px`;
    },
    onChange: (bpm: number) => model.update(marker.id, bpm),
    onDelete: (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      model.remove(marker.id);
    },
  };
}
