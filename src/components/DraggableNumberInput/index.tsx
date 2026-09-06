import { useEffect, useRef, type InputHTMLAttributes } from "react";

type DraggableNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "value"
> & {
  value: number | string;
  onValueChange: (value: string) => void;
};

export function DraggableNumberInput({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: DraggableNumberInputProps) {
  const dragStartRef = useRef<{ value: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const lastEmittedValueRef = useRef<number | null>(null);
  const numericStep = Number(step) || 1;

  const emitPendingValue = () => {
    const pendingValue = pendingValueRef.current;
    pendingValueRef.current = null;
    animationFrameRef.current = null;
    if (pendingValue === null || pendingValue === lastEmittedValueRef.current)
      return;

    lastEmittedValueRef.current = pendingValue;
    onValueChange(String(Number(pendingValue.toFixed(8))));
  };

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    []
  );

  const finishDragging = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      emitPendingValue();
    }
    dragStartRef.current = null;
    lastEmittedValueRef.current = null;
  };

  return (
    <input
      {...props}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      data-draggable-number="true"
      onChange={(event) => onValueChange(event.target.value)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.button !== 0) return;

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return;

        dragStartRef.current = { value: numericValue, y: event.clientY };
        lastEmittedValueRef.current = numericValue;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const dragStart = dragStartRef.current;
        if (!dragStart) return;

        const steps = Math.trunc((dragStart.y - event.clientY) / 4);
        if (steps === 0) return;

        const nextValue = Math.min(
          Number(max ?? Number.POSITIVE_INFINITY),
          Math.max(
            Number(min ?? Number.NEGATIVE_INFINITY),
            dragStart.value + steps * numericStep
          )
        );
        if (
          nextValue === lastEmittedValueRef.current ||
          nextValue === pendingValueRef.current
        )
          return;

        event.preventDefault();
        pendingValueRef.current = nextValue;
        if (animationFrameRef.current === null) {
          animationFrameRef.current =
            window.requestAnimationFrame(emitPendingValue);
        }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        finishDragging();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        finishDragging();
      }}
    />
  );
}
