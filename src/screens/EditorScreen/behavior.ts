import { useEditorBackground } from "../../hooks/editor/useEditorBackground";
import { useEditorBackgroundView } from "../../hooks/editor/useEditorBackgroundView";
import { useEditorComponentModels } from "../../hooks/editor/useEditorComponentModels";
import { useEditorDataLifetime } from "../../hooks/editor/useEditorData";
import { useEditorDataState } from "../../hooks/editor/useEditorDataState";
import { useEditorEnvironment } from "../../hooks/editor/useEditorEnvironment";
import { useEditorErrors } from "../../hooks/editor/useEditorErrors";
import { useEditorExport } from "../../hooks/editor/useEditorExport";
import { useEditorExportView } from "../../hooks/editor/useEditorExportView";
import { useEditorHeaderView } from "../../hooks/editor/useEditorHeaderView";
import { useEditorHistory } from "../../hooks/editor/useEditorHistory";
import { useEditorInspectorView } from "../../hooks/editor/useEditorInspectorView";
import { useEditorMedia } from "../../hooks/editor/useEditorMedia";
import { useEditorPlayback } from "../../hooks/editor/useEditorPlayback";
import { useEditorPlaybackView } from "../../hooks/editor/useEditorPlaybackView";
import { useEditorPreviewView } from "../../hooks/editor/useEditorPreviewView";
import { useEditorProjectChanges } from "../../hooks/editor/useEditorProjectChanges";
import { useEditorProjectValues } from "../../hooks/editor/useEditorProjectValues";
import { useEditorRenderKeys } from "../../hooks/editor/useEditorRenderKeys";
import { useEditorRuntime } from "../../hooks/editor/useEditorRuntime";
import { useEditorSelection } from "../../hooks/editor/useEditorSelection";
import { useEditorSession } from "../../hooks/editor/useEditorSession";
import { useEditorShortcuts } from "../../hooks/editor/useEditorShortcuts";
import { useEditorThumbnail } from "../../hooks/editor/useEditorThumbnail";
import { useEditorTimelineView } from "../../hooks/editor/useEditorTimelineView";
import { useEditorTracks } from "../../hooks/editor/useEditorTracks";
import { useEditorTransientState } from "../../hooks/editor/useEditorTransientState";
import { useSubtitleColorPreview } from "../../hooks/editor/useSubtitleColorPreview";
import { useSubtitlePhraseActions } from "../../hooks/editor/useSubtitlePhraseActions";
import { useSubtitleRendering } from "../../hooks/editor/useSubtitleRendering";
import { useSubtitleSelection } from "../../hooks/editor/useSubtitleSelection";
import { useSubtitleStyleValues } from "../../hooks/editor/useSubtitleStyleValues";
import { useSubtitleStyles } from "../../hooks/editor/useSubtitleStyles";
import { useSubtitleTextEditing } from "../../hooks/editor/useSubtitleTextEditing";
import { useSubtitleTiming } from "../../hooks/editor/useSubtitleTiming";
import { useTimelineGestures } from "../../hooks/editor/useTimelineGestures";
import { useTimelineInteractions } from "../../hooks/editor/useTimelineInteractions";
import { useTimelineRendering } from "../../hooks/editor/useTimelineRendering";
import { useTimelineTempo } from "../../hooks/editor/useTimelineTempo";
import { useTimelineViewport } from "../../hooks/editor/useTimelineViewport";

export function useBehavior(_: Record<string, never>) {
  useEditorDataLifetime();
  const editorEnvironment = useEditorEnvironment();
  const editorDataState = useEditorDataState();
  const editorTransientState = useEditorTransientState();
  const editorRuntime = useEditorRuntime({
    editorDataState,
    editorTransientState,
  });
  const editorErrors = useEditorErrors({ editorRuntime, editorDataState });
  const editorProjectChanges = useEditorProjectChanges({
    editorRuntime,
    editorDataState,
    editorEnvironment,
  });
  const editorHistory = useEditorHistory({
    editorRuntime,
    editorProjectChanges,
    editorDataState,
  });
  const editorSession = useEditorSession({
    editorEnvironment,
    editorProjectChanges,
    editorDataState,
    editorRuntime,
  });
  const editorExport = useEditorExport({
    editorEnvironment,
    editorDataState,
    editorTransientState,
    editorRuntime,
  });
  const editorProjectValues = useEditorProjectValues({ editorDataState });
  const editorBackground = useEditorBackground({
    editorProjectValues,
    editorTransientState,
    editorEnvironment,
    editorDataState,
    editorRuntime,
    editorHistory,
    editorErrors,
  });
  useEditorThumbnail({
    editorDataState,
    editorProjectValues,
    editorBackground,
    editorTransientState,
    editorRuntime,
    editorEnvironment,
  });
  const timelineTempo = useTimelineTempo({
    editorDataState,
    editorProjectValues,
    editorRuntime,
    editorHistory,
    editorTransientState,
  });
  const editorMedia = useEditorMedia({
    editorRuntime,
    editorHistory,
    editorDataState,
    editorEnvironment,
    editorProjectValues,
    editorTransientState,
  });
  const timelineViewport = useTimelineViewport({
    editorEnvironment,
    editorRuntime,
    editorProjectValues,
    editorTransientState,
    editorDataState,
  });
  const subtitleSelection = useSubtitleSelection({
    editorProjectValues,
    editorDataState,
  });
  const subtitleStyleValues = useSubtitleStyleValues({
    editorProjectValues,
    subtitleSelection,
    editorEnvironment,
    editorDataState,
  });
  const subtitleStyles = useSubtitleStyles({
    editorRuntime,
    editorProjectValues,
    editorHistory,
    subtitleSelection,
  });
  const subtitleColorPreview = useSubtitleColorPreview({
    editorRuntime,
    editorProjectValues,
    subtitleSelection,
  });
  const subtitleTextEditing = useSubtitleTextEditing({
    editorRuntime,
    editorProjectValues,
    subtitleSelection,
    editorDataState,
    editorHistory,
  });
  const subtitleTiming = useSubtitleTiming({
    editorRuntime,
    editorProjectValues,
    subtitleSelection,
    editorHistory,
  });
  const editorTracks = useEditorTracks({
    editorDataState,
    editorRuntime,
    editorHistory,
    editorEnvironment,
    editorProjectValues,
  });
  const editorPlayback = useEditorPlayback({
    editorRuntime,
    editorMedia,
    editorDataState,
    editorEnvironment,
    editorProjectValues,
    timelineViewport,
  });
  const editorSelection = useEditorSelection({
    editorRuntime,
    editorDataState,
    editorPlayback,
    editorProjectValues,
  });
  const timelineGestures = useTimelineGestures({
    editorRuntime,
    editorDataState,
    editorProjectValues,
    editorTransientState,
    editorProjectChanges,
    editorHistory,
  });
  const subtitlePhraseActions = useSubtitlePhraseActions({
    editorRuntime,
    editorProjectValues,
    editorDataState,
    editorPlayback,
    editorHistory,
    editorEnvironment,
    subtitleSelection,
  });
  const timelineInteractions = useTimelineInteractions({
    editorRuntime,
    editorSelection,
    editorPlayback,
    editorProjectValues,
  });
  useEditorShortcuts({
    editorRuntime,
    editorDataState,
    editorSelection,
    subtitlePhraseActions,
    editorHistory,
    editorPlayback,
    timelineTempo,
  });
  const timelineRendering = useTimelineRendering({
    editorDataState,
    timelineInteractions,
    editorSelection,
    subtitlePhraseActions,
    timelineGestures,
    editorTransientState,
    editorProjectValues,
    editorEnvironment,
  });
  const subtitleRendering = useSubtitleRendering({
    subtitleSelection,
    editorDataState,
    editorProjectValues,
    editorSelection,
  });
  const editorRenderKeys = useEditorRenderKeys({
    editorEnvironment,
    editorDataState,
  });
  const editorHeaderView = useEditorHeaderView({
    editorDataState,
    editorEnvironment,
    editorSession,
  });
  const editorInspectorView = useEditorInspectorView({
    editorDataState,
    subtitleSelection,
    editorProjectValues,
    editorTracks,
    subtitleStyleValues,
    editorEnvironment,
    timelineRendering,
    subtitleRendering,
    editorRenderKeys,
    subtitleTextEditing,
    subtitleStyles,
    subtitleColorPreview,
    subtitleTiming,
    subtitlePhraseActions,
  });
  const editorPlaybackView = useEditorPlaybackView({
    editorDataState,
    editorProjectValues,
    editorMedia,
    editorRuntime,
    editorEnvironment,
    editorPlayback,
  });
  const editorBackgroundView = useEditorBackgroundView({
    editorRuntime,
    editorBackground,
    editorProjectValues,
    editorEnvironment,
    editorTransientState,
    editorMedia,
  });
  const editorPreviewView = useEditorPreviewView({
    editorRuntime,
    subtitleSelection,
    subtitleRendering,
  });
  const editorTimelineView = useEditorTimelineView({
    editorRuntime,
    editorDataState,
    timelineTempo,
    editorTransientState,
    editorEnvironment,
    editorProjectValues,
    timelineRendering,
    timelineInteractions,
    timelineViewport,
  });
  const editorExportView = useEditorExportView({
    editorEnvironment,
    editorTransientState,
    editorExport,
  });
  const view = {
    ...editorHeaderView,
    ...editorInspectorView,
    ...editorPlaybackView,
    ...editorBackgroundView,
    ...editorPreviewView,
    ...editorTimelineView,
    ...editorExportView,
    timelineRenderKey: timelineRendering.timelineRenderKey,
    sidebarRenderKey: editorRenderKeys.sidebarRenderKey,
    headerRenderKey: editorRenderKeys.headerRenderKey,
  };
  const models = useEditorComponentModels(view);
  return { ...view, ...models };
}

export type EditorBehavior = ReturnType<typeof useBehavior>;
