import { useCallback, type MouseEvent } from "react";
import {
  sortSubtitlePhrases,
  type KaraokeProject,
  type SubtitlePhrase,
  type SubtitleTrack,
} from "../../domain/project";
import {
  createPhraseAt,
  duplicatePhraseAt,
  joinSubtitlePhrases,
  splitPhraseAtClosestWordBoundary,
  timeAtTimelinePosition,
} from "../../screens/EditorScreen/timeline";
import { clamp } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorPlayback } from "./useEditorPlayback";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    | "projectRef"
    | "timelineContentRef"
    | "phraseClipboardRef"
    | "currentTimeRef"
  >;
  editorProjectValues: Pick<
    EditorProjectValues,
    "timelineDuration" | "subtitleTrack"
  >;
  editorDataState: Pick<
    EditorDataState,
    | "setSelectedTrackId"
    | "setSelectedPhraseId"
    | "setSelectedWordId"
    | "selectedPhraseIds"
    | "setSelectedPhraseIds"
    | "setPhraseSelectionAnchorId"
  >;
  editorPlayback: Pick<EditorPlayback, "onSeek">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  subtitleSelection: Pick<SubtitleSelection, "activePhrase">;
}

export function useSubtitlePhraseActions({
  editorRuntime,
  editorProjectValues,
  editorDataState,
  editorPlayback,
  editorHistory,
  editorEnvironment,
  subtitleSelection,
}: Options) {
  const { projectRef, timelineContentRef, phraseClipboardRef, currentTimeRef } =
    editorRuntime;
  const { timelineDuration, subtitleTrack } = editorProjectValues;
  const {
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedWordId,
    selectedPhraseIds,
    setSelectedPhraseIds,
    setPhraseSelectionAnchorId,
  } = editorDataState;
  const { onSeek } = editorPlayback;
  const { persistProject } = editorHistory;
  const { t } = editorEnvironment;
  const { activePhrase } = subtitleSelection;
  const onSplitPhrase = useCallback(
    (track: SubtitleTrack, phrase: SubtitlePhrase, clientX: number) => {
      const currentProject = projectRef.current;
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      if (!currentProject || !bounds) return;
      const currentTrack = currentProject.tracks.find(
        (item): item is SubtitleTrack =>
          item.type === "subtitle" && item.id === track.id
      );
      const currentPhrase = currentTrack?.phrases.find(
        (item) => item.id === phrase.id
      );
      if (!currentTrack || !currentPhrase) return;
      const split = splitPhraseAtClosestWordBoundary(
        currentPhrase,
        timeAtTimelinePosition(
          clientX,
          bounds.left,
          bounds.width,
          timelineDuration
        )
      );
      if (!split) return;
      const [firstPhrase, secondPhrase] = split;
      const next: KaraokeProject = {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((item) =>
          item.type === "subtitle" && item.id === currentTrack.id
            ? {
                ...item,
                phrases: sortSubtitlePhrases(
                  item.phrases.flatMap((itemPhrase) =>
                    itemPhrase.id === currentPhrase.id
                      ? [firstPhrase, secondPhrase]
                      : itemPhrase
                  )
                ),
              }
            : item
        ),
      };
      setSelectedTrackId(currentTrack.id);
      setSelectedPhraseId(secondPhrase.id);
      setSelectedWordId(secondPhrase.words[0]?.id ?? null);
      onSeek(secondPhrase.start);
      persistProject(next, true);
    },
    [onSeek, persistProject, timelineDuration]
  );

  const onInsertPhrase = useCallback(
    (event: MouseEvent<HTMLDivElement>, subtitleTarget: SubtitleTrack) => {
      if (event.target !== event.currentTarget) return;
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const start =
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) *
        timelineDuration;
      const phrase = createPhraseAt(
        start,
        timelineDuration,
        t("editor.newPhrase")
      );
      const next: KaraokeProject = {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type !== "subtitle" || track.id !== subtitleTarget.id
            ? track
            : {
                ...track,
                phrases: sortSubtitlePhrases([...track.phrases, phrase]),
              }
        ),
      };
      setSelectedTrackId(subtitleTarget.id);
      setSelectedPhraseId(phrase.id);
      setSelectedWordId(phrase.words[0]?.id ?? null);
      onSeek(phrase.start);
      persistProject(next, true);
    },
    [onSeek, persistProject, t, timelineDuration]
  );

  const onDeletePhrase = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject || !subtitleTrack) return;
    const currentTrack = currentProject.tracks.find(
      (track): track is SubtitleTrack =>
        track.type === "subtitle" && track.id === subtitleTrack.id
    );

    if (!currentTrack) return;

    const phraseIds = new Set(
      selectedPhraseIds.length > 0
        ? selectedPhraseIds
        : activePhrase
          ? [activePhrase.id]
          : []
    );
    if (!phraseIds.size) return;
    const phrases = currentTrack.phrases.filter(
      (phrase) => !phraseIds.has(phrase.id)
    );
    if (phrases.length === currentTrack.phrases.length) return;
    const next: KaraokeProject = {
      ...currentProject,
      updatedAt: String(Date.now()),
      tracks: currentProject.tracks.map((track) =>
        track.type === "subtitle" && track.id === subtitleTrack.id
          ? { ...track, phrases }
          : track
      ),
    };
    setSelectedPhraseId(null);
    setSelectedPhraseIds([]);
    setPhraseSelectionAnchorId(null);
    setSelectedWordId(null);
    persistProject(next, true);
  }, [
    activePhrase,
    persistProject,
    selectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedPhraseIds,
    subtitleTrack,
  ]);

  const onJoinPhrases = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject || !subtitleTrack || selectedPhraseIds.length < 2)
      return false;
    const currentTrack = currentProject.tracks.find(
      (track): track is SubtitleTrack =>
        track.type === "subtitle" && track.id === subtitleTrack.id
    );
    if (!currentTrack) return false;
    const selectedIds = new Set(selectedPhraseIds);
    const selectedPhrases = currentTrack.phrases.filter((phrase) =>
      selectedIds.has(phrase.id)
    );
    const joined = joinSubtitlePhrases(selectedPhrases);
    if (!joined) return false;
    const next: KaraokeProject = {
      ...currentProject,
      updatedAt: String(Date.now()),
      tracks: currentProject.tracks.map((track) =>
        track.type === "subtitle" && track.id === currentTrack.id
          ? {
              ...track,
              phrases: sortSubtitlePhrases([
                ...track.phrases.filter(
                  (phrase) => !selectedIds.has(phrase.id)
                ),
                joined,
              ]),
            }
          : track
      ),
    };
    setSelectedPhraseId(joined.id);
    setSelectedPhraseIds([joined.id]);
    setPhraseSelectionAnchorId(joined.id);
    setSelectedWordId(joined.words[0]?.id ?? null);
    onSeek(joined.start);
    persistProject(next, true);
    return true;
  }, [
    onSeek,
    persistProject,
    selectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedPhraseIds,
    subtitleTrack,
  ]);

  const onCopyPhrase = useCallback(() => {
    const phrases =
      subtitleTrack?.phrases.filter((phrase) =>
        selectedPhraseIds.includes(phrase.id)
      ) ?? [];
    if (!phrases.length) return false;
    phraseClipboardRef.current = structuredClone(phrases);
    return true;
  }, [selectedPhraseIds, subtitleTrack]);

  const onPastePhrase = useCallback(() => {
    const currentProject = projectRef.current;
    const copiedPhrases = phraseClipboardRef.current;
    if (!currentProject || !subtitleTrack || !copiedPhrases.length)
      return false;
    const firstStart = Math.min(...copiedPhrases.map((phrase) => phrase.start));
    const lastEnd = Math.max(...copiedPhrases.map((phrase) => phrase.end));
    const delta = clamp(
      currentTimeRef.current - firstStart,
      -firstStart,
      timelineDuration - lastEnd
    );
    const phrases = copiedPhrases.map((phrase) =>
      duplicatePhraseAt(phrase, phrase.start + delta, timelineDuration)
    );
    const next: KaraokeProject = {
      ...currentProject,
      updatedAt: String(Date.now()),
      tracks: currentProject.tracks.map((track) =>
        track.type === "subtitle" && track.id === subtitleTrack.id
          ? {
              ...track,
              phrases: sortSubtitlePhrases([...track.phrases, ...phrases]),
            }
          : track
      ),
    };
    setSelectedPhraseId(phrases[0].id);
    setSelectedPhraseIds(phrases.map((phrase) => phrase.id));
    setPhraseSelectionAnchorId(phrases[0].id);
    setSelectedWordId(phrases[0].words[0]?.id ?? null);
    onSeek(phrases[0].start);
    persistProject(next, true);
    return true;
  }, [
    onSeek,
    persistProject,
    setPhraseSelectionAnchorId,
    setSelectedPhraseIds,
    subtitleTrack,
    timelineDuration,
  ]);
  return {
    onCopyPhrase,
    onPastePhrase,
    onSplitPhrase,
    onDeletePhrase,
    onJoinPhrases,
    onInsertPhrase,
  };
}

export type SubtitlePhraseActions = ReturnType<typeof useSubtitlePhraseActions>;
