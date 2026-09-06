import { memo } from "react";
import { Check, ChevronLeft, Download, MoreVertical } from "lucide-react";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  EditorHeader as Header,
  HeaderActions,
  ProjectTitle,
  SavedState,
} from "../../styles";

function EditorHeaderView() {
  useEditorState((behavior) => behavior.headerRenderKey);
  const behavior = useEditorBehavior();

  return (
    <Header>
      <ProjectTitle>
        <button
          type="button"
          aria-label={behavior.backLabel}
          onClick={behavior.onBack}
        >
          <ChevronLeft size={18} />
        </button>
        <h1>{behavior.projectName}</h1>
        <SavedState>
          <Check size={13} />
          {behavior.savedLabel}
        </SavedState>
      </ProjectTitle>
      <HeaderActions>
        <button
          type="button"
          title={behavior.zoomResetLabel}
          onClick={behavior.onResetZoom}
        >
          {behavior.zoomLabel}
        </button>
        <button type="button">{behavior.aspectLabel}</button>
        <button type="button">
          <Download size={15} />
          {behavior.exportLabel}
        </button>
        <button type="button" aria-label="More">
          <MoreVertical size={17} />
        </button>
      </HeaderActions>
    </Header>
  );
}

export const EditorHeader = memo(EditorHeaderView);
EditorHeader.displayName = "EditorHeader";
