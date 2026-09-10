import {
  createElement,
  useCallback,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { SubtitlePhrase, SubtitleWord } from "../../../../domain/project";
import { usePhraseClipGestures } from "../../../../hooks/editor/usePhraseClipGestures";
import { WordEdge, WordLabel, WordSegment } from "./styles";

export interface PhraseWordView extends SubtitleWord {
  left: string;
  width: string;
  active: boolean;
  selected: boolean;
}

export interface PhraseClipProps {
  phrase: SubtitlePhrase;
  left: string;
  width: string;
  selected: boolean;
  splitting: boolean;
  words: PhraseWordView[];
  interactionKey: object;
  onSelect: (phrase: SubtitlePhrase, event: MouseEvent<HTMLElement>) => void;
  onSelectWord: (
    phrase: SubtitlePhrase,
    word: SubtitleWord,
    clientX?: number
  ) => void;
  onHoverPhrase: (phrase: SubtitlePhrase, clientX: number) => void;
  onLeavePhrase: (phrase: SubtitlePhrase) => void;
  onSplitPhrase: (phrase: SubtitlePhrase, clientX: number) => void;
  onStartPhraseGesture: (
    event: PointerEvent<HTMLElement>,
    phrase: SubtitlePhrase,
    mode: "move" | "start" | "end",
    initialClientX?: number
  ) => void;
  onStartWordGesture: (
    event: PointerEvent<HTMLElement>,
    phrase: SubtitlePhrase,
    word: SubtitleWord,
    edge: "start" | "end" | "move",
    initialClientX?: number
  ) => void;
}

export function arePhraseClipPropsEqual(
  previous: PhraseClipProps,
  next: PhraseClipProps
) {
  if (
    previous.phrase !== next.phrase ||
    previous.left !== next.left ||
    previous.width !== next.width ||
    previous.selected !== next.selected ||
    previous.splitting !== next.splitting ||
    previous.interactionKey !== next.interactionKey ||
    previous.words.length !== next.words.length
  ) {
    return false;
  }

  return previous.words.every(
    (word, index) =>
      word.active === next.words[index].active &&
      word.selected === next.words[index].selected
  );
}

export function useBehavior(props: PhraseClipProps) {
  const {
    suppressWordTimingClickRef,
    startWordTimingDrag,
    startPhraseDrag,
    onWordClick,
  } = usePhraseClipGestures(props);
  const renderWord = useCallback(
    (word: PhraseWordView) =>
      createElement(
        WordSegment,
        {
          $active: word.active,
          $selected: word.selected,
          $splitting: props.splitting,
          $gap: word.type === "gap",
          "data-timeline-word-id": word.id,
          style: { left: word.left, width: word.width },
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            suppressWordTimingClickRef.current = false;
            if (props.splitting) {
              event.stopPropagation();
              return;
            }
            if (event.shiftKey || event.metaKey) return;
            if (event.ctrlKey) {
              startWordTimingDrag(event, word, "move");
              return;
            }
            event.stopPropagation();
            startPhraseDrag(event);
          },
          onClick: (event: MouseEvent<HTMLElement>) => {
            if (event.ctrlKey || event.metaKey || event.shiftKey) return;
            onWordClick(event);
            if (!event.defaultPrevented)
              props.onSelectWord(props.phrase, word, event.clientX);
            event.stopPropagation();
          },
          onDoubleClick: (event: MouseEvent<HTMLElement>) =>
            event.stopPropagation(),
        },
        createElement(WordLabel, undefined, word.text),
        createElement(WordEdge, {
          $side: "start",
          $visible: word.selected,
          $splitting: props.splitting,
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            event.stopPropagation();
            if (!props.splitting) startWordTimingDrag(event, word, "start");
          },
          onClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
        }),
        createElement(WordEdge, {
          $side: "end",
          $visible: word.selected,
          $splitting: props.splitting,
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            event.stopPropagation();
            if (!props.splitting) startWordTimingDrag(event, word, "end");
          },
          onClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
        })
      ),
    [onWordClick, props, startPhraseDrag, startWordTimingDrag]
  );
  const onSelect = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (props.splitting) {
        event.stopPropagation();
        props.onSplitPhrase(props.phrase, event.clientX);
        return;
      }
      props.onSelect(props.phrase, event);
    },
    [props]
  );
  const onMoveStart = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (props.splitting) {
        event.stopPropagation();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      props.onStartPhraseGesture(event, props.phrase, "move");
    },
    [props]
  );
  const onStartResize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (props.splitting) {
        event.stopPropagation();
        return;
      }
      props.onStartPhraseGesture(event, props.phrase, "start");
    },
    [props]
  );
  const onEndResize = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (props.splitting) {
        event.stopPropagation();
        return;
      }
      props.onStartPhraseGesture(event, props.phrase, "end");
    },
    [props]
  );
  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    []
  );
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) =>
      props.onHoverPhrase(props.phrase, event.clientX),
    [props]
  );
  const onPointerLeave = useCallback(
    () => props.onLeavePhrase(props.phrase),
    [props]
  );

  return {
    ...props,
    renderWord,
    onSelect,
    onMoveStart,
    onStartResize,
    onEndResize,
    onDoubleClick,
    onPointerMove,
    onPointerEnter: onPointerMove,
    onPointerLeave,
    getWordId: (word: PhraseWordView) => word.id,
  };
}
