import { useCallback } from "react";
import { type SubtitleTrack } from "../../domain/project";
import { isSubtitleTrack } from "../../util/editor/projectEditing";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "setSelectedPhraseIds"
    | "setPhraseSelectionAnchorId"
    | "setSelectedWordId"
    | "setTrackPendingDeletionId"
    | "trackPendingDeletionId"
  >;
  editorRuntime: Pick<EditorRuntime, "projectRef">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  editorProjectValues: Pick<
    EditorProjectValues,
    "subtitleTracks" | "subtitleTrack"
  >;
}

export function useEditorTracks({
  editorDataState,
  editorRuntime,
  editorHistory,
  editorEnvironment,
  editorProjectValues,
}: Options) {
  const {
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedWordId,
    setTrackPendingDeletionId,
    trackPendingDeletionId,
  } = editorDataState;
  const { projectRef } = editorRuntime;
  const { persistProject } = editorHistory;
  const { t } = editorEnvironment;
  const { subtitleTracks, subtitleTrack } = editorProjectValues;
  const onSelectTrack = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setSelectedPhraseId(null);
      setSelectedPhraseIds([]);
      setPhraseSelectionAnchorId(null);
      setSelectedWordId(null);
    },
    [
      setSelectedPhraseId,
      setSelectedPhraseIds,
      setPhraseSelectionAnchorId,
      setSelectedTrackId,
      setSelectedWordId,
    ]
  );

  const onRenameTrack = useCallback(
    (trackId: string, name: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const track = currentProject.tracks.find((item) => item.id === trackId);
      if (!track || track.name === name) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((item) =>
          item.id === trackId ? { ...item, name } : item
        ),
      });
    },
    [persistProject]
  );

  const onAddSubtitleTrack = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject) return;
    const track: SubtitleTrack = {
      id: `subtitles-${Date.now()}-${crypto.randomUUID()}`,
      type: "subtitle",
      name: t("editor.newSubtitleTrack", {
        number: String(subtitleTracks.length + 1),
      }),
      visible: true,
      locked: false,
      zIndex:
        Math.max(20, ...currentProject.tracks.map((item) => item.zIndex)) + 1,
      style: {
        unreadColor: "#FFFFFF",
        readColor: "#FF0044",
        scale: 1,
        x: 0,
        y: 30 + subtitleTracks.length * 72,
      },
      curve: "linear",
      animation: { template: "template-1" },
      phrases: [],
    };
    setSelectedTrackId(track.id);
    setSelectedPhraseId(null);
    setSelectedWordId(null);
    persistProject(
      {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: [...currentProject.tracks, track],
      },
      true
    );
  }, [persistProject, subtitleTracks.length, t]);

  const deleteSubtitleTrack = useCallback(
    (trackId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const trackIndex = currentProject.tracks.findIndex(
        (track) => track.type === "subtitle" && track.id === trackId
      );
      if (trackIndex < 0) return;

      const deletedSubtitleIndex = currentProject.tracks
        .filter(isSubtitleTrack)
        .findIndex((track) => track.id === trackId);
      const tracks = currentProject.tracks.filter(
        (track) => track.id !== trackId
      );
      const remainingSubtitleTracks = tracks.filter(isSubtitleTrack);
      const nextSelectedTrack =
        remainingSubtitleTracks[
          Math.min(deletedSubtitleIndex, remainingSubtitleTracks.length - 1)
        ] ??
        tracks[Math.min(trackIndex, tracks.length - 1)] ??
        null;

      setTrackPendingDeletionId(null);
      setSelectedTrackId(nextSelectedTrack?.id ?? null);
      setSelectedPhraseId(null);
      setSelectedWordId(null);
      persistProject(
        {
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks,
        },
        true
      );
    },
    [persistProject]
  );

  const onRequestDeleteTrack = useCallback(() => {
    if (!subtitleTrack) return;
    if (subtitleTrack.phrases.length > 0) {
      setTrackPendingDeletionId(subtitleTrack.id);
      return;
    }
    deleteSubtitleTrack(subtitleTrack.id);
  }, [deleteSubtitleTrack, subtitleTrack]);

  const onConfirmDeleteTrack = useCallback(() => {
    if (!trackPendingDeletionId) return;
    deleteSubtitleTrack(trackPendingDeletionId);
  }, [deleteSubtitleTrack, trackPendingDeletionId]);

  const onCancelDeleteTrack = useCallback(
    () => setTrackPendingDeletionId(null),
    []
  );

  const trackPendingDeletion =
    subtitleTracks.find((track) => track.id === trackPendingDeletionId) ?? null;
  return {
    trackPendingDeletion,
    onSelectTrack,
    onRenameTrack,
    onRequestDeleteTrack,
    onConfirmDeleteTrack,
    onCancelDeleteTrack,
    onAddSubtitleTrack,
  };
}

export type EditorTracks = ReturnType<typeof useEditorTracks>;
