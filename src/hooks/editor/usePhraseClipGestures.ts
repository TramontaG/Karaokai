import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type {
  PhraseClipProps,
  PhraseWordView,
} from "../../screens/EditorScreen/components/PhraseClip/behavior";

export function usePhraseClipGestures(props: PhraseClipProps) {
  const gestureController = useRef<AbortController | null>(null);
  useEffect(() => () => gestureController.current?.abort(), []);
  const suppressWordTimingClickRef = useRef(false);
  const startWordTimingDrag = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      word: PhraseWordView,
      edge: "start" | "end" | "move"
    ) => {
      gestureController.current?.abort();
      const controller = new AbortController();
      gestureController.current = controller;
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      let started = false;
      const onMove = (moveEvent: globalThis.PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        if (
          !started &&
          (Math.abs(moveEvent.clientX - startX) > 3 ||
            Math.abs(moveEvent.clientY - startY) > 3)
        ) {
          started = true;
          props.onSelectWord(props.phrase, word);
          props.onStartWordGesture(
            moveEvent as unknown as PointerEvent<HTMLElement>,
            props.phrase,
            word,
            edge,
            startX
          );
        }
      };
      const onFinish = (finishEvent: globalThis.PointerEvent) => {
        if (finishEvent.pointerId !== pointerId) return;
        controller.abort();
        gestureController.current = null;
        if (started) suppressWordTimingClickRef.current = true;
      };
      const options = { signal: controller.signal };
      window.addEventListener("pointermove", onMove, options);
      window.addEventListener("pointerup", onFinish, options);
      window.addEventListener("pointercancel", onFinish, options);
      window.addEventListener("blur", () => controller.abort(), options);
    },
    [props]
  );
  const startPhraseDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      gestureController.current?.abort();
      const controller = new AbortController();
      gestureController.current = controller;
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      let started = false;
      const onMove = (moveEvent: globalThis.PointerEvent) => {
        if (
          moveEvent.pointerId !== pointerId ||
          started ||
          (Math.abs(moveEvent.clientX - startX) <= 3 &&
            Math.abs(moveEvent.clientY - startY) <= 3)
        )
          return;
        started = true;
        props.onStartPhraseGesture(
          moveEvent as unknown as PointerEvent<HTMLElement>,
          props.phrase,
          "move",
          startX
        );
      };
      const onFinish = (finishEvent: globalThis.PointerEvent) => {
        if (finishEvent.pointerId !== pointerId) return;
        controller.abort();
        gestureController.current = null;
        if (started) suppressWordTimingClickRef.current = true;
      };
      const options = { signal: controller.signal };
      window.addEventListener("pointermove", onMove, options);
      window.addEventListener("pointerup", onFinish, options);
      window.addEventListener("pointercancel", onFinish, options);
      window.addEventListener("blur", () => controller.abort(), options);
    },
    [props]
  );
  const onWordClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!suppressWordTimingClickRef.current) return;
    suppressWordTimingClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    suppressWordTimingClickRef,
    startWordTimingDrag,
    startPhraseDrag,
    onWordClick,
  };
}
