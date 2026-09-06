import { memo } from "react";
import { Check, ChevronLeft, Download, Minus, Square, X } from "lucide-react";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  EditorHeader as Header,
  HeaderActions,
  HeaderLabel,
  HeaderWindowAction,
  HeaderWindowActions,
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
        <HeaderLabel>{behavior.zoomLabel}</HeaderLabel>
        <HeaderLabel>{behavior.aspectLabel}</HeaderLabel>
        <button
          type="button"
          data-action="export"
          onClick={behavior.onOpenExport}
        >
          <Download size={15} />
          {behavior.exportLabel}
        </button>
      </HeaderActions>
      <HeaderWindowActions>
        <HeaderWindowAction
          type="button"
          aria-label={behavior.minimizeWindowLabel}
          onClick={behavior.onMinimizeWindow}
        >
          <Minus aria-hidden="true" size={18} />
        </HeaderWindowAction>
        <HeaderWindowAction
          type="button"
          aria-label={behavior.maximizeWindowLabel}
          onClick={behavior.onToggleMaximizeWindow}
        >
          <Square aria-hidden="true" size={15} />
        </HeaderWindowAction>
        <HeaderWindowAction
          type="button"
          aria-label={behavior.closeWindowLabel}
          onClick={behavior.onCloseWindow}
        >
          <X aria-hidden="true" size={19} />
        </HeaderWindowAction>
      </HeaderWindowActions>
    </Header>
  );
}

export const EditorHeader = memo(EditorHeaderView);
EditorHeader.displayName = "EditorHeader";
