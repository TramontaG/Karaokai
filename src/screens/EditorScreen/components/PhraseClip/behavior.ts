import {
  createElement,
  useCallback,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { SubtitlePhrase, SubtitleWord } from "../../../../domain/project";
import { ClipEdge, WordEdge, WordLabel, WordSegment } from "./styles";

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
  words: PhraseWordView[];
  interactionKey: object;
  onSelect: (phrase: SubtitlePhrase) => void;
  onSelectWord: (phrase: SubtitlePhrase, word: SubtitleWord) => void;
  onStartPhraseGesture: (
    event: PointerEvent<HTMLElement>,
    phrase: SubtitlePhrase,
    mode: "move" | "start" | "end"
  ) => void;
  onStartWordGesture: (
    event: PointerEvent<HTMLElement>,
    phrase: SubtitlePhrase,
    word: SubtitleWord,
    edge: "start" | "end"
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
  const renderWord = useCallback(
    (word: PhraseWordView) =>
      createElement(
        WordSegment,
        {
          $active: word.active,
          $selected: word.selected,
          style: { left: word.left, width: word.width },
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            event.stopPropagation();
            props.onSelectWord(props.phrase, word);
            props.onStartPhraseGesture(event, props.phrase, "move");
          },
          onDoubleClick: (event: MouseEvent<HTMLElement>) =>
            event.stopPropagation(),
        },
        createElement(WordLabel, undefined, word.text),
        createElement(WordEdge, {
          $side: "start",
          $visible: word.selected,
          onPointerDown: (event: PointerEvent<HTMLElement>) =>
            props.onStartWordGesture(event, props.phrase, word, "start"),
        }),
        createElement(WordEdge, {
          $side: "end",
          $visible: word.selected,
          onPointerDown: (event: PointerEvent<HTMLElement>) =>
            props.onStartWordGesture(event, props.phrase, word, "end"),
        })
      ),
    [props]
  );
  const onSelect = useCallback(() => props.onSelect(props.phrase), [props]);
  const onMoveStart = useCallback(
    (event: PointerEvent<HTMLElement>) =>
      props.onStartPhraseGesture(event, props.phrase, "move"),
    [props]
  );
  const onStartResize = useCallback(
    (event: PointerEvent<HTMLElement>) =>
      props.onStartPhraseGesture(event, props.phrase, "start"),
    [props]
  );
  const onEndResize = useCallback(
    (event: PointerEvent<HTMLElement>) =>
      props.onStartPhraseGesture(event, props.phrase, "end"),
    [props]
  );
  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    []
  );

  return {
    ...props,
    renderWord,
    onSelect,
    onMoveStart,
    onStartResize,
    onEndResize,
    onDoubleClick,
    getWordId: (word: PhraseWordView) => word.id,
  };
}
