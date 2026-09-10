import { type ChangeEvent } from "react";
import { formatTime } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorMedia } from "./useEditorMedia";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    "currentTime" | "isPlaying" | "isAudioReady"
  >;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  editorMedia: Pick<
    EditorMedia,
    | "instrumentalSource"
    | "vocalsSource"
    | "instrumentalVolume"
    | "vocalsVolume"
    | "updateAudioMix"
  >;
  editorRuntime: Pick<EditorRuntime, "instrumentalAudio" | "vocalsAudio">;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  editorPlayback: Pick<
    EditorPlayback,
    | "onTogglePlayback"
    | "onSeek"
    | "onSkipBack"
    | "onSkipForward"
    | "onPlaybackEnded"
    | "onInstrumentalError"
    | "onInstrumentalCanPlay"
  >;
}

export function useEditorPlaybackView({
  editorDataState,
  editorProjectValues,
  editorMedia,
  editorRuntime,
  editorEnvironment,
  editorPlayback,
}: Options) {
  const { currentTime, isPlaying, isAudioReady } = editorDataState;
  const { timelineDuration } = editorProjectValues;
  const {
    instrumentalSource,
    vocalsSource,
    instrumentalVolume,
    vocalsVolume,
    updateAudioMix,
  } = editorMedia;
  const { instrumentalAudio, vocalsAudio } = editorRuntime;
  const { t } = editorEnvironment;
  const {
    onTogglePlayback,
    onSeek,
    onSkipBack,
    onSkipForward,
    onPlaybackEnded,
    onInstrumentalError,
    onInstrumentalCanPlay,
  } = editorPlayback;
  return {
    currentTime,
    duration: timelineDuration,
    isPlaying,
    isAudioReady,
    instrumentalSource,
    vocalsSource,
    instrumentalAudio,
    vocalsAudio,
    instrumentalVolume,
    vocalsVolume,
    instrumentalVolumeLabel: t("editor.instrumentalVolume"),
    vocalsVolumeLabel: t("editor.vocalsVolume"),
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(timelineDuration),
    onTogglePlayback,
    onSeek,
    onSeekInput: (event: ChangeEvent<HTMLInputElement>) =>
      onSeek(Number(event.target.value)),
    onSkipBack,
    onSkipForward,
    onPlaybackEnded,
    onInstrumentalError,
    onInstrumentalCanPlay,
    onInstrumentalVolumeChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateAudioMix("volume", Number(event.target.value)),
    onVocalsVolumeChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateAudioMix("vocalsVolume", Number(event.target.value)),
  };
}

export type EditorPlaybackView = ReturnType<typeof useEditorPlaybackView>;
