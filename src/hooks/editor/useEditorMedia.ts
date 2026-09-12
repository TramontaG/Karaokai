import { createBackgroundVideoSync } from "../../util/editor/backgroundVideoSync";
import { useCallback, useEffect, useMemo } from "react";
import { projectAudioSources, readProjectAudio } from "../../services/projects";
import { clamp } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    | "projectRef"
    | "backgroundVideo"
    | "instrumentalAudio"
    | "vocalsAudio"
    | "currentTimeRef"
  >;
  editorHistory: Pick<EditorHistory, "persistProject">;
  editorDataState: Pick<
    EditorDataState,
    "setIsAudioReady" | "setAudioSources" | "setError" | "audioSources"
  >;
  editorEnvironment: Pick<EditorEnvironment, "projectId" | "data">;
  editorProjectValues: Pick<EditorProjectValues, "audioTrack">;
  editorTransientState: Pick<EditorTransientState, "setBackgroundMediaReady">;
}

export function useEditorMedia({
  editorRuntime,
  editorHistory,
  editorDataState,
  editorEnvironment,
  editorProjectValues,
  editorTransientState,
}: Options) {
  const {
    projectRef,
    backgroundVideo,
    instrumentalAudio,
    vocalsAudio,
    currentTimeRef,
  } = editorRuntime;
  const { persistProject } = editorHistory;
  const { setIsAudioReady, setAudioSources, setError, audioSources } =
    editorDataState;
  const { projectId, data } = editorEnvironment;
  const { audioTrack } = editorProjectValues;
  const { setBackgroundMediaReady } = editorTransientState;
  const updateAudioMix = useCallback(
    (property: "volume" | "vocalsVolume", percentage: number) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type === "audio"
            ? { ...track, [property]: clamp(percentage, 0, 100) / 100 }
            : track
        ),
      });
    },
    [persistProject]
  );

  useEffect(() => {
    let disposed = false;
    const objectUrls: string[] = [];
    setIsAudioReady(false);
    setAudioSources(null);
    void projectAudioSources(projectId, data.preferences.storageDirectory)
      .then(async (sources) => {
        const createAudioUrl = async (sourceId: string | null) => {
          if (!sourceId) return null;
          const bytes = await readProjectAudio(sourceId);
          const url = URL.createObjectURL(
            new Blob([bytes], { type: "audio/mpeg" })
          );
          if (disposed) {
            URL.revokeObjectURL(url);
            return null;
          }
          objectUrls.push(url);
          return url;
        };
        const [instrumental, vocals] = await Promise.all([
          createAudioUrl(sources.instrumental),
          createAudioUrl(sources.vocals),
        ]);
        if (!disposed) setAudioSources({ instrumental, vocals });
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason));
      });
    return () => {
      disposed = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.preferences.storageDirectory, projectId]);

  const instrumentalSource = audioSources?.instrumental ?? undefined;

  const vocalsSource = audioSources?.vocals ?? undefined;

  const instrumentalVolume = clamp(
    Math.round((audioTrack?.volume ?? 1) * 100),
    0,
    100
  );

  const vocalsVolume = clamp(
    Math.round((audioTrack?.vocalsVolume ?? 0) * 100),
    0,
    100
  );

  const syncVideo = useMemo(() => createBackgroundVideoSync(), []);
  const syncBackgroundVideoTime = useCallback(
    (seconds: number, force = false) => {
      const video = backgroundVideo.current;
      const audio = instrumentalAudio.current;
      if (!video) return;
      syncVideo(
        video,
        seconds,
        Boolean(audio && !audio.paused && !audio.ended),
        force
      );
    },
    [syncVideo]
  );

  const updateMediaTime = useCallback(
    (milliseconds: number) => {
      const seconds = milliseconds / 1000;
      [instrumentalAudio.current, vocalsAudio.current].forEach((audio) => {
        if (!audio) return;
        try {
          audio.currentTime = seconds;
          audio.playbackRate = 1;
        } catch {
          // Metadata may still be loading; the next seek will apply the position.
        }
      });
      syncBackgroundVideoTime(seconds, true);
    },
    [syncBackgroundVideoTime]
  );

  useEffect(() => {
    if (instrumentalAudio.current)
      instrumentalAudio.current.volume = instrumentalVolume / 100;
    if (vocalsAudio.current) vocalsAudio.current.volume = vocalsVolume / 100;
  }, [instrumentalVolume, vocalsVolume]);

  useEffect(
    () => () => {
      instrumentalAudio.current?.pause();
      vocalsAudio.current?.pause();
      backgroundVideo.current?.pause();
    },
    []
  );

  const onBackgroundVideoLoadedMetadata = useCallback(() => {
    setBackgroundMediaReady(true);
    syncBackgroundVideoTime(currentTimeRef.current / 1000, true);
  }, [syncBackgroundVideoTime]);
  return {
    instrumentalSource,
    updateMediaTime,
    vocalsSource,
    syncBackgroundVideoTime,
    instrumentalVolume,
    vocalsVolume,
    updateAudioMix,
    onBackgroundVideoLoadedMetadata,
  };
}

export type EditorMedia = ReturnType<typeof useEditorMedia>;
