import { type CSSProperties } from "react";
import {
  resolveSubtitleStyle,
  resolveTimingCurve,
  wordReadProgress,
  type SubtitleStyle,
  type SubtitleTrack,
} from "../../domain/project";
import {
  phraseEntryCueProgress,
  subtitlePreviewAt,
} from "../../screens/EditorScreen/timeline";

export function subtitlePreviewView(track: SubtitleTrack, currentTime: number) {
  const timing = subtitlePreviewAt(
    track.phrases,
    currentTime,
    track.animation?.template ?? "template-1"
  );
  const playingPhrase = timing.currentPhrase;
  const entryCuePhrase =
    playingPhrase ??
    [timing.primaryPhrase, timing.secondaryPhrase].find(
      (phrase) => phrase !== null && phrase.start > currentTime
    ) ??
    null;
  const entryCueProgress = phraseEntryCueProgress(entryCuePhrase, currentTime);
  const entryCueColors = resolveSubtitleStyle(
    track.style,
    entryCuePhrase?.style,
    entryCuePhrase?.words[0]?.style
  );
  const positionReferenceWidth = track.style.positionReferenceWidth ?? 640;
  const positionReferenceHeight = track.style.positionReferenceHeight ?? 360;
  const words = (timing.primaryPhrase?.words ?? [])
    .filter((word) => word.type !== "gap")
    .map((word) => {
      const style = resolveSubtitleStyle(
        track.style,
        timing.primaryPhrase?.style,
        word.style
      );
      return {
        ...word,
        progress: timing.primaryFullyRead
          ? 1
          : wordReadProgress(
              word,
              currentTime,
              resolveTimingCurve(
                track.curve,
                timing.primaryPhrase?.curve,
                word.curve
              )
            ),
        readColor: style.readColor,
        unreadColor: style.unreadColor,
        scale: style.scale,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textDecoration: style.textDecoration,
        verticalAlign: style.verticalAlign,
        offsetX: ((word.style?.x ?? 0) / positionReferenceWidth) * 100,
        offsetY: ((word.style?.y ?? 0) / positionReferenceHeight) * 100,
        unreadColorSource: subtitleColorSource(
          "unreadColor",
          track.style,
          timing.primaryPhrase?.style,
          word.style
        ),
        readColorSource: subtitleColorSource(
          "readColor",
          track.style,
          timing.primaryPhrase?.style,
          word.style
        ),
      };
    });
  const secondaryWords = (timing.secondaryPhrase?.words ?? [])
    .filter((word) => word.type !== "gap")
    .map((word) => {
      const style = resolveSubtitleStyle(
        track.style,
        timing.secondaryPhrase?.style,
        word.style
      );
      return {
        ...word,
        progress: 0,
        readColor: style.readColor,
        unreadColor: style.unreadColor,
        scale: style.scale,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textDecoration: style.textDecoration,
        verticalAlign: style.verticalAlign,
        offsetX: ((word.style?.x ?? 0) / positionReferenceWidth) * 100,
        offsetY: ((word.style?.y ?? 0) / positionReferenceHeight) * 100,
        unreadColorSource: subtitleColorSource(
          "unreadColor",
          track.style,
          timing.secondaryPhrase?.style,
          word.style
        ),
        readColorSource: subtitleColorSource(
          "readColor",
          track.style,
          timing.secondaryPhrase?.style,
          word.style
        ),
      };
    });

  return {
    id: track.id,
    timing,
    playingPhrase,
    entryCuePhrase,
    words,
    secondaryWords,
    visible:
      track.visible && (words.length > 0 || timing.secondaryPhrase !== null),
    containerStyle: {
      left: `calc(50% + ${((track.style.x ?? 0) / positionReferenceWidth) * 100}%)`,
      top: `calc(50% + ${((track.style.y ?? 0) / positionReferenceHeight) * 100}%)`,
      zIndex: track.zIndex,
    } as CSSProperties,
    currentStyle: {
      opacity: timing.primaryOpacity,
      "--phrase-offset-x": `${((timing.primaryPhrase?.style?.x ?? 0) / positionReferenceWidth) * 100}cqw`,
      "--phrase-offset-y": `${((timing.primaryPhrase?.style?.y ?? 0) / positionReferenceHeight) * 100}cqw`,
    } as CSSProperties,
    nextPhraseStyle: {
      opacity: timing.secondaryOpacity,
      top: `${timing.secondaryOffset * 50}%`,
      transform: `translate(calc(-50% + ${((timing.secondaryPhrase?.style?.x ?? 0) / positionReferenceWidth) * 100}cqw), calc(${(timing.secondaryOffset - 1) * 50}% + ${timing.secondaryOffset * 0.75}rem + ${((timing.secondaryPhrase?.style?.y ?? 0) / positionReferenceHeight) * 100}cqw)) scale(${timing.secondaryScale})`,
    } as CSSProperties,
    entryCueStyle: {
      "--entry-cue-progress": entryCueProgress ?? 0,
      "--entry-cue-empty-color": entryCueColors.unreadColor,
      "--entry-cue-fill-color": entryCueColors.readColor,
      "--entry-cue-scale": entryCueColors.scale,
    } as CSSProperties,
    showEntryCue: entryCueProgress !== null && !timing.suppressEntryCue,
  };
}

export function subtitleColorSource(
  property: "unreadColor" | "readColor",
  trackStyle: SubtitleStyle,
  phraseStyle?: SubtitleStyle,
  wordStyle?: SubtitleStyle
): "track" | "phrase" | "word" | "default" {
  if (wordStyle?.[property] !== undefined) return "word";
  if (phraseStyle?.[property] !== undefined) return "phrase";
  if (trackStyle[property] !== undefined) return "track";
  return "default";
}
