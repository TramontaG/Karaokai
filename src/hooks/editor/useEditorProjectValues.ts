import { useEffect, useMemo } from "react";
import { hasSubtitlePhraseTiming } from "../../domain/project";
import {
  isAudioTrack,
  isBackgroundTrack,
  isSubtitleTrack,
} from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    "project" | "selectedTrackId" | "setSelectedTrackId"
  >;
}

export function useEditorProjectValues({ editorDataState }: Options) {
  const { project, selectedTrackId, setSelectedTrackId } = editorDataState;
  const subtitleTracks = useMemo(
    () => project?.tracks.filter(isSubtitleTrack) ?? [],
    [project]
  );

  const firstPhraseStart = useMemo(
    () =>
      [...subtitleTracks]
        .flatMap((track) => track.phrases.filter(hasSubtitlePhraseTiming))
        .reduce<number | null>(
          (earliest, phrase) =>
            earliest === null || phrase.start < earliest
              ? phrase.start
              : earliest,
          null
        ),
    [subtitleTracks]
  );

  const selectedProjectTrack = useMemo(
    () => project?.tracks.find((track) => track.id === selectedTrackId) ?? null,
    [project, selectedTrackId]
  );

  const subtitleTrack = isSubtitleTrack(selectedProjectTrack)
    ? selectedProjectTrack
    : null;

  const backgroundTrack = isBackgroundTrack(selectedProjectTrack)
    ? selectedProjectTrack
    : null;

  const projectBackgroundTrack = useMemo(
    () => project?.tracks.find(isBackgroundTrack) ?? null,
    [project]
  );

  useEffect(() => {
    if (!project) return;
    if (project.tracks.some((track) => track.id === selectedTrackId)) return;
    setSelectedTrackId(
      project.tracks.find(isSubtitleTrack)?.id ?? project.tracks[0]?.id ?? null
    );
  }, [project, selectedTrackId]);

  const audioTrack = useMemo(
    () => project?.tracks.find(isAudioTrack) ?? null,
    [project]
  );

  const timelineDuration = Math.max(
    project?.duration ?? 0,
    subtitleTracks.reduce(
      (trackMaximum, track) =>
        Math.max(
          trackMaximum,
          track.phrases.reduce(
            (phraseMaximum, phrase) =>
              hasSubtitlePhraseTiming(phrase)
                ? Math.max(phraseMaximum, phrase.end)
                : phraseMaximum,
            0
          )
        ),
      0
    ),
    1
  );
  return {
    projectBackgroundTrack,
    backgroundTrack,
    firstPhraseStart,
    subtitleTracks,
    timelineDuration,
    audioTrack,
    subtitleTrack,
  };
}

export type EditorProjectValues = ReturnType<typeof useEditorProjectValues>;
