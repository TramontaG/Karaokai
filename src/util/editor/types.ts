import { Image } from "lucide-react";
import { type EditorInspectorTab } from "../../context/EditorData";
import { type KaraokeProject, type ProjectTrack } from "../../domain/project";

export type InspectorTab = EditorInspectorTab;

export type PhraseGesture = "move" | "start" | "end";

export type SubtitlePropertyScope = "track" | "phrase" | "word";

export type CurveOption = { id: string; label: string };

export type EditorHistoryEntry = {
  project: KaraokeProject;
  selectedTrackId: string | null;
  selectedPhraseId: string | null;
  selectedPhraseIds: string[];
  phraseSelectionAnchorId: string | null;
  selectedWordId: string | null;
};

export type TimelineRow = {
  id: string;
  type: ProjectTrack["type"];
  label: string;
  Icon: typeof Image;
  track: ProjectTrack | null;
};

export type TimelineVisibleRange = { start: number; end: number };

export type TimelineMarker = { id: string; time: number };
