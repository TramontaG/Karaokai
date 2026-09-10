import type { EditorBackgroundView } from "./useEditorBackgroundView";
import type { EditorExportView } from "./useEditorExportView";
import type { EditorHeaderView } from "./useEditorHeaderView";
import type { EditorInspectorView } from "./useEditorInspectorView";
import type { EditorPlaybackView } from "./useEditorPlaybackView";
import type { EditorPreviewView } from "./useEditorPreviewView";
import type { EditorTimelineView } from "./useEditorTimelineView";

export type EditorView = EditorHeaderView &
  EditorInspectorView &
  EditorPlaybackView &
  EditorBackgroundView &
  EditorPreviewView &
  EditorTimelineView &
  EditorExportView;
