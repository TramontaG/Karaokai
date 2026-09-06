import type {
  SubtitleAnimationTemplate,
  SubtitlePhrase,
  SubtitleWord,
} from "../../domain/project";

export const MIN_PHRASE_DURATION = 200;
export const MIN_WORD_DURATION = 40;
export const SUBTITLE_FADE_DURATION = 2_000;
export const NEXT_PHRASE_MAX_GAP = 4_000;
export const FAST_PHRASE_FADE_DURATION = 350;

const SECONDARY_PHRASE_OPACITY = 0.54;
const SECONDARY_PHRASE_SCALE = 0.62;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function timeAtTimelinePosition(
  clientX: number,
  timelineLeft: number,
  timelineWidth: number,
  duration: number
) {
  const position = clamp(
    (clientX - timelineLeft) / Math.max(1, timelineWidth),
    0,
    1
  );
  return Math.round(position * Math.max(0, duration));
}

export function timelineFollowScrollLeft(
  currentTime: number,
  duration: number,
  contentOffset: number,
  contentWidth: number,
  viewportWidth: number,
  scrollWidth: number,
  viewportAnchor = 0.45
) {
  const playheadPosition =
    contentOffset +
    contentWidth * clamp(currentTime / Math.max(1, duration), 0, 1);
  return clamp(
    playheadPosition - viewportWidth * viewportAnchor,
    0,
    Math.max(0, scrollWidth - viewportWidth)
  );
}

const identifier = (kind: "phrase" | "word") =>
  `${kind}-${Date.now()}-${crypto.randomUUID()}`;

function templateOneSubtitlePreviewAt(
  phrases: SubtitlePhrase[],
  currentTime: number,
  fadeDuration = SUBTITLE_FADE_DURATION
) {
  const ordered = phrases;
  const currentPhrase =
    [...ordered]
      .reverse()
      .find(
        (phrase) => currentTime >= phrase.start && currentTime <= phrase.end
      ) ?? null;

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const previousPhrase = ordered[index];
    const nextPhrase = ordered[index + 1];
    const gap = nextPhrase.start - previousPhrase.end;
    if (gap >= NEXT_PHRASE_MAX_GAP) continue;
    const transitionStartsAt =
      gap >= FAST_PHRASE_FADE_DURATION
        ? previousPhrase.end
        : nextPhrase.start - FAST_PHRASE_FADE_DURATION;
    const transitionEndsAt =
      gap >= FAST_PHRASE_FADE_DURATION
        ? previousPhrase.end + FAST_PHRASE_FADE_DURATION
        : nextPhrase.start;
    if (currentTime < transitionStartsAt || currentTime >= nextPhrase.start)
      continue;
    const transitionProgress = clamp(
      (currentTime - transitionStartsAt) /
        Math.max(1, transitionEndsAt - transitionStartsAt),
      0,
      1
    );
    return {
      currentPhrase,
      primaryPhrase: previousPhrase,
      primaryOpacity: 1 - transitionProgress,
      primaryFullyRead: currentTime >= previousPhrase.end,
      secondaryPhrase: nextPhrase,
      secondaryOpacity:
        SECONDARY_PHRASE_OPACITY +
        (1 - SECONDARY_PHRASE_OPACITY) * transitionProgress,
      secondaryOffset: 1 - transitionProgress,
      secondaryScale:
        SECONDARY_PHRASE_SCALE +
        (1 - SECONDARY_PHRASE_SCALE) * transitionProgress,
      suppressEntryCue: true,
    };
  }

  if (currentPhrase) {
    const currentIndex = ordered.findIndex(
      (phrase) => phrase.id === currentPhrase.id
    );
    const previousCandidate = ordered[currentIndex - 1] ?? null;
    const nextCandidate = ordered[currentIndex + 1] ?? null;
    const nextPhrase =
      nextCandidate &&
      nextCandidate.start - currentPhrase.end < NEXT_PHRASE_MAX_GAP
        ? nextCandidate
        : null;
    const followsContinuousPhrase =
      previousCandidate !== null &&
      currentPhrase.start - previousCandidate.end < NEXT_PHRASE_MAX_GAP;
    return {
      currentPhrase,
      primaryPhrase: currentPhrase,
      primaryOpacity: 1,
      primaryFullyRead: false,
      secondaryPhrase: nextPhrase,
      secondaryOpacity: SECONDARY_PHRASE_OPACITY,
      secondaryOffset: 1,
      secondaryScale: SECONDARY_PHRASE_SCALE,
      suppressEntryCue: followsContinuousPhrase,
    };
  }

  const previousPhrase =
    [...ordered].reverse().find((phrase) => phrase.end <= currentTime) ?? null;
  const nextPhrase =
    ordered.find((phrase) => phrase.start > currentTime) ?? null;
  const fadeWindow = Math.max(1, fadeDuration);
  const previousAge = previousPhrase
    ? currentTime - previousPhrase.end
    : Number.POSITIVE_INFINITY;
  const nextLead = nextPhrase
    ? nextPhrase.start - currentTime
    : Number.POSITIVE_INFINITY;
  const showPrevious = previousAge <= fadeWindow;
  const showNext = nextLead <= fadeWindow;

  if (showPrevious) {
    return {
      currentPhrase: null,
      primaryPhrase: previousPhrase,
      primaryOpacity: clamp(1 - previousAge / fadeWindow, 0, 1),
      primaryFullyRead: true,
      secondaryPhrase: showNext ? nextPhrase : null,
      secondaryOpacity: showNext
        ? SECONDARY_PHRASE_OPACITY * clamp(1 - nextLead / fadeWindow, 0, 1)
        : 0,
      secondaryOffset: 1,
      secondaryScale: SECONDARY_PHRASE_SCALE,
      suppressEntryCue: false,
    };
  }

  return {
    currentPhrase: null,
    primaryPhrase: showNext ? nextPhrase : null,
    primaryOpacity: showNext ? clamp(1 - nextLead / fadeWindow, 0, 1) : 0,
    primaryFullyRead: false,
    secondaryPhrase: null,
    secondaryOpacity: 0,
    secondaryOffset: 0,
    secondaryScale: 1,
    suppressEntryCue: false,
  };
}

export function subtitlePreviewAt(
  phrases: SubtitlePhrase[],
  currentTime: number,
  template: SubtitleAnimationTemplate = "template-1"
) {
  switch (template) {
    case "template-1":
      return templateOneSubtitlePreviewAt(phrases, currentTime);
  }
}

export function phraseEntryCueProgress(
  phrase: SubtitlePhrase | null,
  currentTime: number,
  fadeDuration = SUBTITLE_FADE_DURATION
) {
  if (!phrase) return null;
  const cueStart = phrase.start - Math.max(1, fadeDuration);
  const firstWord = phrase.words[0];
  const cueFillEnd = firstWord?.start ?? phrase.start;
  const cueVisibleEnd = firstWord?.end ?? phrase.start;
  if (currentTime < cueStart || currentTime > cueVisibleEnd) return null;
  return clamp(
    (currentTime - cueStart) / Math.max(1, cueFillEnd - cueStart),
    0,
    1
  );
}

export function wordsForText(phrase: SubtitlePhrase, text: string) {
  const tokens = text.match(/\S+/g) ?? [];
  if (tokens.length === phrase.words.length) {
    return phrase.words.map((word, index) => ({
      ...word,
      text: tokens[index],
    }));
  }
  if (tokens.length === 0) return [];

  const duration = Math.max(tokens.length, phrase.end - phrase.start);
  const totalWeight = tokens.reduce(
    (total, token) => total + Math.max(1, token.length),
    0
  );
  let cursor = phrase.start;
  return tokens.map<SubtitleWord>((token, index) => {
    const remainingTokens = tokens.length - index - 1;
    const proportionalEnd =
      phrase.start +
      Math.round(
        (tokens
          .slice(0, index + 1)
          .reduce((total, item) => total + Math.max(1, item.length), 0) /
          totalWeight) *
          duration
      );
    const end =
      index === tokens.length - 1
        ? phrase.end
        : clamp(proportionalEnd, cursor + 1, phrase.end - remainingTokens);
    const word = {
      id: identifier("word"),
      text: token,
      start: cursor,
      end,
    };
    cursor = end;
    return word;
  });
}

export function movePhrase(
  phrase: SubtitlePhrase,
  requestedDelta: number,
  duration: number
) {
  const delta = clamp(requestedDelta, -phrase.start, duration - phrase.end);
  return {
    ...phrase,
    start: phrase.start + delta,
    end: phrase.end + delta,
    words: phrase.words.map((word) => ({
      ...word,
      start: word.start + delta,
      end: word.end + delta,
    })),
  };
}

export function duplicatePhraseAt(
  phrase: SubtitlePhrase,
  requestedStart: number,
  duration: number
) {
  const shifted = movePhrase(
    phrase,
    Math.round(requestedStart) - phrase.start,
    duration
  );
  return {
    ...shifted,
    id: identifier("phrase"),
    style: shifted.style ? { ...shifted.style } : undefined,
    words: shifted.words.map((word) => ({
      ...word,
      id: identifier("word"),
      style: word.style ? { ...word.style } : undefined,
    })),
  };
}

export function resizePhraseStart(
  phrase: SubtitlePhrase,
  requestedStart: number
) {
  const firstWord = phrase.words[0];
  const maximum = Math.min(
    phrase.end - MIN_PHRASE_DURATION,
    firstWord ? firstWord.end - MIN_WORD_DURATION : Number.POSITIVE_INFINITY
  );
  const start = clamp(requestedStart, 0, maximum);
  return {
    ...phrase,
    start,
    words: firstWord
      ? phrase.words.map((word, index) =>
          index === 0 ? { ...word, start } : word
        )
      : phrase.words,
  };
}

export function resizePhraseEnd(
  phrase: SubtitlePhrase,
  requestedEnd: number,
  duration: number
) {
  const lastIndex = phrase.words.length - 1;
  const lastWord = phrase.words[lastIndex];
  const minimum = Math.max(
    phrase.start + MIN_PHRASE_DURATION,
    lastWord ? lastWord.start + MIN_WORD_DURATION : 0
  );
  const end = clamp(requestedEnd, minimum, duration);
  return {
    ...phrase,
    end,
    words: lastWord
      ? phrase.words.map((word, index) =>
          index === lastIndex ? { ...word, end } : word
        )
      : phrase.words,
  };
}

export function resizeWordBoundary(
  phrase: SubtitlePhrase,
  wordId: string,
  edge: "start" | "end",
  requestedTime: number,
  duration: number
) {
  const index = phrase.words.findIndex((word) => word.id === wordId);
  if (index < 0) return phrase;
  if (edge === "start" && index === 0) {
    return resizePhraseStart(phrase, requestedTime);
  }
  if (edge === "end" && index === phrase.words.length - 1) {
    return resizePhraseEnd(phrase, requestedTime, duration);
  }

  const words = phrase.words.map((word) => ({ ...word }));
  if (edge === "start") {
    const previous = words[index - 1];
    const current = words[index];
    const boundary = clamp(
      requestedTime,
      previous.start + MIN_WORD_DURATION,
      current.end - MIN_WORD_DURATION
    );
    previous.end = boundary;
    current.start = boundary;
  } else {
    const current = words[index];
    const next = words[index + 1];
    const boundary = clamp(
      requestedTime,
      current.start + MIN_WORD_DURATION,
      next.end - MIN_WORD_DURATION
    );
    current.end = boundary;
    next.start = boundary;
  }
  return { ...phrase, words };
}

export function createPhraseAt(
  requestedStart: number,
  duration: number,
  text: string
) {
  const start = clamp(
    Math.round(requestedStart),
    0,
    Math.max(0, duration - MIN_PHRASE_DURATION)
  );
  const end = Math.min(duration, start + 3_000);
  const phrase: SubtitlePhrase = {
    id: identifier("phrase"),
    text,
    start,
    end,
    words: [],
  };
  return { ...phrase, words: wordsForText(phrase, text) };
}
