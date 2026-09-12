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
const DEFAULT_GAP_DURATION = 150;

function lastPhraseStartingAtOrBefore(
  phrases: SubtitlePhrase[],
  currentTime: number
) {
  let low = 0;
  let high = phrases.length - 1;
  let result = -1;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    if (phrases[middle].start <= currentTime) {
      result = middle;
      low = middle + 1;
    } else high = middle - 1;
  }

  return result;
}

function templateOneSubtitlePreviewAt(
  phrases: SubtitlePhrase[],
  currentTime: number,
  fadeDuration = SUBTITLE_FADE_DURATION
) {
  const ordered = phrases;
  const previousIndex = lastPhraseStartingAtOrBefore(ordered, currentTime);
  const previousPhrase = ordered[previousIndex] ?? null;
  const currentPhrase =
    previousPhrase && currentTime <= previousPhrase.end ? previousPhrase : null;
  const nextPhrase = ordered[previousIndex + 1] ?? null;

  if (previousPhrase && nextPhrase) {
    const gap = nextPhrase.start - previousPhrase.end;
    if (gap < NEXT_PHRASE_MAX_GAP) {
      const transitionStartsAt =
        gap >= FAST_PHRASE_FADE_DURATION
          ? previousPhrase.end
          : nextPhrase.start - FAST_PHRASE_FADE_DURATION;
      const transitionEndsAt =
        gap >= FAST_PHRASE_FADE_DURATION
          ? previousPhrase.end + FAST_PHRASE_FADE_DURATION
          : nextPhrase.start;
      if (currentTime >= transitionStartsAt && currentTime < nextPhrase.start) {
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
          secondaryOpacity: 1,
          secondaryOffset: 1 - transitionProgress,
          secondaryScale:
            SECONDARY_PHRASE_SCALE +
            (1 - SECONDARY_PHRASE_SCALE) * transitionProgress,
          suppressEntryCue: true,
        };
      }
    }
  }

  if (currentPhrase) {
    const previousCandidate = ordered[previousIndex - 1] ?? null;
    const nextCandidate = nextPhrase;
    const followsContinuousPhrase =
      previousCandidate !== null &&
      currentPhrase.start - previousCandidate.end < NEXT_PHRASE_MAX_GAP;
    const nextGap = nextCandidate
      ? nextCandidate.start - currentPhrase.end
      : Number.POSITIVE_INFINITY;
    const nextTransitionStartsAt =
      nextGap >= FAST_PHRASE_FADE_DURATION
        ? currentPhrase.end
        : (nextCandidate?.start ?? 0) - FAST_PHRASE_FADE_DURATION;
    const previewStartsAt = Math.max(
      currentPhrase.start,
      nextTransitionStartsAt - fadeDuration
    );
    const shouldShowNextPreview =
      nextCandidate !== null &&
      nextGap < NEXT_PHRASE_MAX_GAP &&
      currentTime >= previewStartsAt;
    const previewProgress = shouldShowNextPreview
      ? clamp(
          (currentTime - previewStartsAt) /
            Math.max(1, nextTransitionStartsAt - previewStartsAt),
          0,
          1
        )
      : 0;
    return {
      currentPhrase,
      primaryPhrase: currentPhrase,
      primaryOpacity: 1,
      primaryFullyRead: false,
      secondaryPhrase: shouldShowNextPreview ? nextCandidate : null,
      secondaryOpacity: previewProgress,
      secondaryOffset: 1,
      secondaryScale: SECONDARY_PHRASE_SCALE,
      suppressEntryCue: followsContinuousPhrase,
    };
  }

  const nextPhraseAfterGap = nextPhrase;
  const previousPhraseBeforeGap = previousPhrase;
  const fadeWindow = Math.max(1, fadeDuration);
  const previousAge = previousPhraseBeforeGap
    ? currentTime - previousPhraseBeforeGap.end
    : Number.POSITIVE_INFINITY;
  const nextLead = nextPhraseAfterGap
    ? nextPhraseAfterGap.start - currentTime
    : Number.POSITIVE_INFINITY;
  const showPrevious = previousAge <= fadeWindow;
  const showNext = nextLead <= fadeWindow;

  if (showPrevious) {
    return {
      currentPhrase: null,
      primaryPhrase: previousPhraseBeforeGap,
      primaryOpacity: clamp(1 - previousAge / fadeWindow, 0, 1),
      primaryFullyRead: true,
      secondaryPhrase: showNext ? nextPhraseAfterGap : null,
      secondaryOpacity: showNext ? clamp(1 - nextLead / fadeWindow, 0, 1) : 0,
      secondaryOffset: 1,
      secondaryScale: SECONDARY_PHRASE_SCALE,
      suppressEntryCue: false,
    };
  }

  return {
    currentPhrase: null,
    primaryPhrase: showNext ? nextPhraseAfterGap : null,
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

export function joinSubtitlePhrases(phrases: SubtitlePhrase[]) {
  if (phrases.length < 2) return null;
  const ordered = [...phrases].sort(
    (left, right) => left.start - right.start || left.end - right.end
  );
  const words: SubtitleWord[] = [];
  ordered.forEach((phrase) => {
    const previous = words.at(-1);
    if (previous && phrase.start > previous.end) {
      words.push({
        id: `gap-${previous.id}-${phrase.id}`,
        type: "gap",
        text: "",
        start: previous.end,
        end: phrase.start,
      });
    }
    words.push(...phrase.words.map((word) => ({ ...word })));
  });
  return {
    ...ordered[0],
    text: ordered
      .map((phrase) => phrase.text.trim())
      .filter(Boolean)
      .join(" "),
    start: ordered[0].start,
    end: ordered.at(-1)?.end ?? ordered[0].end,
    words,
  };
}

/**
 * Replaces a single token's text. Multiple whitespace-delimited terms become
 * consecutive words that retain the source token's time span, apportioned by
 * their character counts.
 */
export function replacePhraseWordText(
  phrase: SubtitlePhrase,
  wordId: string,
  text: string
) {
  const index = phrase.words.findIndex((word) => word.id === wordId);
  if (index < 0) return phrase;

  const tokens = text.match(/\S+/g) ?? [];
  const source = phrase.words[index];
  const replacement: SubtitleWord[] = [];

  if (tokens.length === 0) {
    replacement.push({ ...source, text: "", type: "gap" });
  } else if (tokens.length === 1) {
    replacement.push({ ...source, text: tokens[0], type: "word" });
  } else {
    const weights = tokens.map((token) =>
      Math.max(1, Array.from(token).length)
    );
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    const duration = source.end - source.start;
    let consumedWeight = 0;
    let cursor = source.start;

    tokens.forEach((token, tokenIndex) => {
      consumedWeight += weights[tokenIndex];
      const remainingTokens = tokens.length - tokenIndex - 1;
      const proportionalEnd =
        source.start + Math.round((consumedWeight / totalWeight) * duration);
      const end =
        tokenIndex === tokens.length - 1
          ? source.end
          : clamp(proportionalEnd, cursor + 1, source.end - remainingTokens);
      replacement.push({
        ...source,
        id: tokenIndex === 0 ? source.id : identifier("word"),
        text: token,
        type: "word",
        start: cursor,
        end,
      });
      cursor = end;
    });
  }

  const words = [
    ...phrase.words.slice(0, index),
    ...replacement,
    ...phrase.words.slice(index + 1),
  ];
  return {
    ...phrase,
    text: words
      .filter((word) => word.type !== "gap")
      .map((word) => word.text)
      .join(" "),
    words,
  };
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

export function splitPhraseAtClosestWordBoundary(
  phrase: SubtitlePhrase,
  requestedTime: number
) {
  const words = [...phrase.words].sort(
    (left, right) => left.start - right.start || left.end - right.end
  );
  if (words.length < 2) return null;

  const boundaries = words.slice(1).flatMap((word, index) => [
    { time: words[index].end, wordIndex: index + 1 },
    { time: word.start, wordIndex: index + 1 },
  ]);
  const boundary = boundaries.reduce((closest, candidate) =>
    Math.abs(candidate.time - requestedTime) <
    Math.abs(closest.time - requestedTime)
      ? candidate
      : closest
  );
  const firstWords = words.slice(0, boundary.wordIndex);
  const secondWords = words.slice(boundary.wordIndex);

  return [
    {
      ...phrase,
      text: firstWords
        .filter((word) => word.type !== "gap")
        .map((word) => word.text)
        .join(" "),
      start: firstWords[0].start,
      end: firstWords[firstWords.length - 1].end,
      words: firstWords,
    },
    {
      ...phrase,
      id: identifier("phrase"),
      text: secondWords
        .filter((word) => word.type !== "gap")
        .map((word) => word.text)
        .join(" "),
      start: secondWords[0].start,
      end: secondWords[secondWords.length - 1].end,
      words: secondWords,
    },
  ] as const;
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

export function moveWordWithinPhrase(
  phrase: SubtitlePhrase,
  wordId: string,
  requestedDelta: number,
  duration: number
) {
  const index = phrase.words.findIndex((word) => word.id === wordId);
  if (index < 0) return phrase;
  if (phrase.words.length === 1)
    return movePhrase(phrase, requestedDelta, duration);

  const words = phrase.words.map((word) => ({ ...word }));
  const current = words[index];
  const previous = words[index - 1];
  const next = words[index + 1];
  const minimumDelta = previous
    ? previous.start + MIN_WORD_DURATION - current.start
    : -phrase.start;
  const maximumDelta = next
    ? next.end - MIN_WORD_DURATION - current.end
    : duration - phrase.end;
  const delta = clamp(requestedDelta, minimumDelta, maximumDelta);

  current.start += delta;
  current.end += delta;
  if (previous) previous.end = current.start;
  if (next) next.start = current.end;

  return {
    ...phrase,
    start: index === 0 ? current.start : phrase.start,
    end: index === words.length - 1 ? current.end : phrase.end,
    words,
  };
}

export function insertGapAfterWord(
  phrase: SubtitlePhrase,
  wordId: string,
  duration: number
) {
  const index = phrase.words.findIndex((word) => word.id === wordId);
  if (index < 0) return phrase;
  const source = phrase.words[index];
  const gapDuration = Math.min(
    DEFAULT_GAP_DURATION,
    Math.max(0, duration - phrase.end)
  );
  if (gapDuration === 0) return phrase;

  const gap: SubtitleWord = {
    id: identifier("word"),
    type: "gap",
    text: "",
    start: source.end,
    end: source.end + gapDuration,
  };
  const words = phrase.words.flatMap((word, wordIndex) => {
    if (wordIndex < index) return word;
    if (wordIndex === index) return [word, gap];
    return {
      ...word,
      start: word.start + gapDuration,
      end: word.end + gapDuration,
    };
  });
  return {
    ...phrase,
    end: phrase.end + gapDuration,
    words,
  };
}

export function removePhraseWord(phrase: SubtitlePhrase, wordId: string) {
  const index = phrase.words.findIndex((word) => word.id === wordId);
  if (index < 0) return phrase;
  const removed = phrase.words[index];
  const words = phrase.words
    .filter((word) => word.id !== wordId)
    .map((word) => ({ ...word }));
  const next = words[index];
  const previous = words[index - 1];
  if (next) next.start = removed.start;
  else if (previous) previous.end = removed.end;

  return {
    ...phrase,
    text: words
      .filter((word) => word.type !== "gap")
      .map((word) => word.text)
      .join(" "),
    start: words[0]?.start ?? phrase.start,
    end: words.at(-1)?.end ?? phrase.end,
    words,
  };
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
