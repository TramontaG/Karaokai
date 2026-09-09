import { useEditorBehavior, useEditorState } from "../EditorState";

export function useBehavior(_: Record<string, never>) {
  useEditorState((behavior) => behavior.sidebarRenderKey);
  return useEditorBehavior();
}
