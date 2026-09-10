import { useMemo, useState } from "react";
import { type ProjectRenderProgress } from "../../services/projects";
import {
  HIDE_TIMELINE_CLIPS_STORAGE_KEY,
  HIDE_TIMELINE_GRID_STORAGE_KEY,
  HIDE_TIMELINE_PLAYHEAD_STORAGE_KEY,
} from "../../util/editor/constants";
import { debugFlagEnabled } from "../../util/editor/playbackProfiler";
import {
  type TimelineMarker,
  type TimelineVisibleRange,
} from "../../util/editor/types";

export function useEditorTransientState() {
  const hideTimelineGrid = useMemo(
    () => debugFlagEnabled(HIDE_TIMELINE_GRID_STORAGE_KEY),
    []
  );

  const hideTimelineClips = useMemo(
    () => debugFlagEnabled(HIDE_TIMELINE_CLIPS_STORAGE_KEY),
    []
  );

  const hideTimelinePlayhead = useMemo(
    () => debugFlagEnabled(HIDE_TIMELINE_PLAYHEAD_STORAGE_KEY),
    []
  );

  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState<string | null>(
    null
  );

  const [backgroundMediaReady, setBackgroundMediaReady] = useState(false);

  const [timelineDropTargetTrackId, setTimelineDropTargetTrackId] = useState<
    string | null
  >(null);

  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);

  const [timelineVisibleRange, setTimelineVisibleRange] =
    useState<TimelineVisibleRange>({ start: 0, end: 0 });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const [exportResolution, setExportResolution] = useState<
    "480p" | "720p" | "1080p" | "1440p"
  >("1080p");

  const [exportFps, setExportFps] = useState<30 | 60>(60);

  const [exportAudioMode, setExportAudioMode] = useState<
    "mix" | "vocals" | "instrumental"
  >("instrumental");

  const [exportInstrumentalVolume, setExportInstrumentalVolume] = useState(1);

  const [exportVocalsVolume, setExportVocalsVolume] = useState(0);

  const [exportEncodingPreset, setExportEncodingPreset] = useState<
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
  >("veryfast");

  const [renderProgress, setRenderProgress] = useState<{
    jobId: string;
    status: ProjectRenderProgress["status"];
    progress: number;
    outputPath?: string;
    error?: string;
  } | null>(null);

  const [isCancellingExport, setIsCancellingExport] = useState(false);
  return {
    timelineVisibleRange,
    setExportDialogOpen,
    setIsCancellingExport,
    setRenderProgress,
    setExportInstrumentalVolume,
    setExportVocalsVolume,
    setExportAudioMode,
    exportResolution,
    exportAudioMode,
    exportInstrumentalVolume,
    exportVocalsVolume,
    exportFps,
    exportEncodingPreset,
    renderProgress,
    isCancellingExport,
    setBackgroundAssetUrl,
    setBackgroundMediaReady,
    backgroundMediaReady,
    backgroundAssetUrl,
    setTimelineMarkers,
    setTimelineVisibleRange,
    setTimelineDropTargetTrackId,
    timelineDropTargetTrackId,
    timelineMarkers,
    hideTimelineGrid,
    hideTimelineClips,
    hideTimelinePlayhead,
    exportDialogOpen,
    setExportResolution,
    setExportFps,
    setExportEncodingPreset,
  };
}

export type EditorTransientState = ReturnType<typeof useEditorTransientState>;
