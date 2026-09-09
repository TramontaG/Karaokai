import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  formatCubicBezier,
  parseCubicBezier,
  type CubicBezierPoints,
} from "../../../../domain/project";
import { type CubicBezierEditorProps } from ".";

const fallbackPoints: CubicBezierPoints = [0.27, 0.12, 0.19, 0.91];
const GRAPH_SIZE = 100;
const KEYBOARD_STEP = 0.01;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
const roundPoint = (value: number) => Math.round(value * 1000) / 1000;

export function useBehavior(props: CubicBezierEditorProps) {
  const [draftPoints, setDraftPoints] = useState<CubicBezierPoints | null>(
    null
  );
  const draftPointsRef = useRef<CubicBezierPoints | null>(null);
  const sourcePoints = parseCubicBezier(props.value) ?? fallbackPoints;
  const points = draftPoints ?? sourcePoints;

  const nextControlPoint = useCallback(
    (point: 0 | 1, x: number, y: number) => {
      const next = [
        ...(draftPointsRef.current ?? sourcePoints),
      ] as CubicBezierPoints;
      const offset = point * 2;
      next[offset] = roundPoint(clamp(x, 0, 1));
      next[offset + 1] = roundPoint(clamp(y, 0, 1));
      return next;
    },
    [sourcePoints]
  );

  const previewControlPoint = useCallback(
    (point: 0 | 1, x: number, y: number) => {
      const next = nextControlPoint(point, x, y);
      draftPointsRef.current = next;
      setDraftPoints(next);
    },
    [nextControlPoint]
  );

  const updateFromPointer = useCallback(
    (point: 0 | 1, event: PointerEvent<SVGCircleElement>) => {
      const svg = event.currentTarget.ownerSVGElement;
      if (!svg) return;
      const bounds = svg.getBoundingClientRect();
      previewControlPoint(
        point,
        (event.clientX - bounds.left) / Math.max(1, bounds.width),
        1 - (event.clientY - bounds.top) / Math.max(1, bounds.height)
      );
    },
    [previewControlPoint]
  );

  const startDrag = useCallback(
    (point: 0 | 1, event: PointerEvent<SVGCircleElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromPointer(point, event);
    },
    [updateFromPointer]
  );

  const drag = useCallback(
    (point: 0 | 1, event: PointerEvent<SVGCircleElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      updateFromPointer(point, event);
    },
    [updateFromPointer]
  );

  const stopDrag = useCallback(
    (event: PointerEvent<SVGCircleElement>, commit: boolean) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      const next = draftPointsRef.current;
      draftPointsRef.current = null;
      setDraftPoints(null);
      const value = next ? formatCubicBezier(next) : null;
      if (commit && value && value !== props.value) props.onChange(value);
    },
    [props.onChange, props.value]
  );

  const moveWithKeyboard = useCallback(
    (point: 0 | 1, event: KeyboardEvent<SVGCircleElement>) => {
      const offset = point * 2;
      const step = event.shiftKey ? KEYBOARD_STEP * 10 : KEYBOARD_STEP;
      const horizontal =
        event.key === "ArrowLeft"
          ? -step
          : event.key === "ArrowRight"
            ? step
            : 0;
      const vertical =
        event.key === "ArrowDown" ? -step : event.key === "ArrowUp" ? step : 0;
      if (horizontal === 0 && vertical === 0) return;

      event.preventDefault();
      props.onChange(
        formatCubicBezier(
          nextControlPoint(
            point,
            points[offset] + horizontal,
            points[offset + 1] + vertical
          )
        )
      );
    },
    [nextControlPoint, points, props.onChange]
  );

  const pointOne = {
    x: points[0] * GRAPH_SIZE,
    y: (1 - points[1]) * GRAPH_SIZE,
  };
  const pointTwo = {
    x: points[2] * GRAPH_SIZE,
    y: (1 - points[3]) * GRAPH_SIZE,
  };

  return {
    ...props,
    pointOne,
    pointTwo,
    curvePath: `M 0 ${GRAPH_SIZE} C ${pointOne.x} ${pointOne.y}, ${pointTwo.x} ${pointTwo.y}, ${GRAPH_SIZE} 0`,
    pointOneLabel: `${props.labels.p1x} / ${props.labels.p1y}`,
    pointTwoLabel: `${props.labels.p2x} / ${props.labels.p2y}`,
    onPointOnePointerDown: (event: PointerEvent<SVGCircleElement>) =>
      startDrag(0, event),
    onPointOnePointerMove: (event: PointerEvent<SVGCircleElement>) =>
      drag(0, event),
    onPointOneKeyDown: (event: KeyboardEvent<SVGCircleElement>) =>
      moveWithKeyboard(0, event),
    onPointTwoPointerDown: (event: PointerEvent<SVGCircleElement>) =>
      startDrag(1, event),
    onPointTwoPointerMove: (event: PointerEvent<SVGCircleElement>) =>
      drag(1, event),
    onPointTwoKeyDown: (event: KeyboardEvent<SVGCircleElement>) =>
      moveWithKeyboard(1, event),
    onPointerUp: (event: PointerEvent<SVGCircleElement>) =>
      stopDrag(event, true),
    onPointerCancel: (event: PointerEvent<SVGCircleElement>) =>
      stopDrag(event, false),
  };
}
