import type { KaraokeProject } from "../domain/project";

export type EditorInspectorTab = "track" | "phrase" | "word";
export type TimelineTool = "pointer" | "split";

export interface EditorData extends Record<string, unknown> {
  project: KaraokeProject | null;
  currentTime: number;
  isPlaying: boolean;
  isAudioReady: boolean;
  selectedTrackId: string | null;
  selectedPhraseId: string | null;
  selectedPhraseIds: string[];
  phraseSelectionAnchorId: string | null;
  selectedWordId: string | null;
  trackPendingDeletionId: string | null;
  inspectorTab: EditorInspectorTab;
  timelineZoom: number;
  timelineTool: TimelineTool;
  bpmInputValue: string;
  trackScaleInputValue: string;
  phraseScaleInputValue: string;
  wordScaleInputValue: string;
  error: string | null;
  audioSources: { instrumental: string | null; vocals: string | null } | null;
}

export const initialEditorData: EditorData = {
  project: null,
  currentTime: 0,
  isPlaying: false,
  isAudioReady: false,
  selectedTrackId: null,
  selectedPhraseId: null,
  selectedPhraseIds: [],
  phraseSelectionAnchorId: null,
  selectedWordId: null,
  trackPendingDeletionId: null,
  inspectorTab: "track",
  timelineZoom: 1,
  timelineTool: "pointer",
  bpmInputValue: "120",
  trackScaleInputValue: "100",
  phraseScaleInputValue: "",
  wordScaleInputValue: "",
  error: null,
  audioSources: null,
};
