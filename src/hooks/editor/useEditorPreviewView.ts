import type { EditorRuntime } from "./useEditorRuntime";
import type { SubtitleRendering } from "./useSubtitleRendering";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorRuntime: Pick<EditorRuntime, "previewCanvas">;
  subtitleSelection: Pick<SubtitleSelection, "subtitlePreviews">;
  subtitleRendering: Pick<SubtitleRendering, "renderSubtitlePreview">;
}

export function useEditorPreviewView({
  editorRuntime,
  subtitleSelection,
  subtitleRendering,
}: Options) {
  const { previewCanvas } = editorRuntime;
  const { subtitlePreviews } = subtitleSelection;
  const { renderSubtitlePreview } = subtitleRendering;
  return {
    previewCanvas,
    subtitlePreviews,
    renderSubtitlePreview,
    getSubtitlePreviewId: (preview: (typeof subtitlePreviews)[number]) =>
      preview.id,
  };
}

export type EditorPreviewView = ReturnType<typeof useEditorPreviewView>;
