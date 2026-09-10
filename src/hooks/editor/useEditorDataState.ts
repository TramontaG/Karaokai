import { useCallback } from "react";
import type { EditorData, TimelineTool } from "../../context/EditorData";
import { type KaraokeProject } from "../../domain/project";
import { type InspectorTab } from "../../util/editor/types";
import { useEditorData } from "./useEditorData";

export function useEditorDataState() {
  const [editorData, setEditorData] = useEditorData();

  const {
    project,
    currentTime,
    isPlaying,
    isAudioReady,
    selectedTrackId,
    selectedPhraseId,
    selectedPhraseIds,
    phraseSelectionAnchorId,
    selectedWordId,
    trackPendingDeletionId,
    inspectorTab,
    timelineZoom,
    timelineTool,
    bpmInputValue,
    trackScaleInputValue,
    phraseScaleInputValue,
    wordScaleInputValue,
    error,
    audioSources,
  } = editorData;

  const setProject = useCallback(
    (project: KaraokeProject | null) => setEditorData({ project }),
    [setEditorData]
  );

  const setCurrentTime = useCallback(
    (currentTime: number) => setEditorData({ currentTime }),
    [setEditorData]
  );

  const setIsPlaying = useCallback(
    (isPlaying: boolean) => setEditorData({ isPlaying }),
    [setEditorData]
  );

  const setIsAudioReady = useCallback(
    (isAudioReady: boolean) => setEditorData({ isAudioReady }),
    [setEditorData]
  );

  const setSelectedTrackId = useCallback(
    (selectedTrackId: string | null) => setEditorData({ selectedTrackId }),
    [setEditorData]
  );

  const setSelectedPhraseId = useCallback(
    (selectedPhraseId: string | null) => setEditorData({ selectedPhraseId }),
    [setEditorData]
  );

  const setSelectedPhraseIds = useCallback(
    (selectedPhraseIds: string[]) => setEditorData({ selectedPhraseIds }),
    [setEditorData]
  );

  const setPhraseSelectionAnchorId = useCallback(
    (phraseSelectionAnchorId: string | null) =>
      setEditorData({ phraseSelectionAnchorId }),
    [setEditorData]
  );

  const setSelectedWordId = useCallback(
    (selectedWordId: string | null) => setEditorData({ selectedWordId }),
    [setEditorData]
  );

  const setTrackPendingDeletionId = useCallback(
    (trackPendingDeletionId: string | null) =>
      setEditorData({ trackPendingDeletionId }),
    [setEditorData]
  );

  const setInspectorTab = useCallback(
    (inspectorTab: InspectorTab) => setEditorData({ inspectorTab }),
    [setEditorData]
  );

  const setTimelineTool = useCallback(
    (timelineTool: TimelineTool) => setEditorData({ timelineTool }),
    [setEditorData]
  );

  const setBpmInputValue = useCallback(
    (bpmInputValue: string) => setEditorData({ bpmInputValue }),
    [setEditorData]
  );

  const setTrackScaleInputValue = useCallback(
    (trackScaleInputValue: string) => setEditorData({ trackScaleInputValue }),
    [setEditorData]
  );

  const setPhraseScaleInputValue = useCallback(
    (phraseScaleInputValue: string) => setEditorData({ phraseScaleInputValue }),
    [setEditorData]
  );

  const setWordScaleInputValue = useCallback(
    (wordScaleInputValue: string) => setEditorData({ wordScaleInputValue }),
    [setEditorData]
  );

  const setError = useCallback(
    (error: string | null) => setEditorData({ error }),
    [setEditorData]
  );

  const setAudioSources = useCallback(
    (audioSources: EditorData["audioSources"]) =>
      setEditorData({ audioSources }),
    [setEditorData]
  );
  return {
    selectedTrackId,
    selectedPhraseId,
    selectedPhraseIds,
    phraseSelectionAnchorId,
    selectedWordId,
    timelineZoom,
    setError,
    setProject,
    setSelectedTrackId,
    setSelectedPhraseId,
    setSelectedPhraseIds,
    setPhraseSelectionAnchorId,
    setSelectedWordId,
    project,
    setBpmInputValue,
    bpmInputValue,
    setIsAudioReady,
    setAudioSources,
    audioSources,
    isPlaying,
    setEditorData,
    currentTime,
    setTrackScaleInputValue,
    setPhraseScaleInputValue,
    setWordScaleInputValue,
    setTrackPendingDeletionId,
    trackPendingDeletionId,
    setIsPlaying,
    setCurrentTime,
    timelineTool,
    inspectorTab,
    phraseScaleInputValue,
    trackScaleInputValue,
    wordScaleInputValue,
    error,
    setInspectorTab,
    isAudioReady,
    setTimelineTool,
  };
}

export type EditorDataState = ReturnType<typeof useEditorDataState>;
