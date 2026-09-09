import { useEditorBehavior, useEditorState } from "../EditorState";

export function useBehavior(_: Record<string, never>) {
  useEditorState((behavior) => behavior.currentTime);
  useEditorState((behavior) => behavior.isAudioReady);
  useEditorState((behavior) => behavior.isPlaying);
  return useEditorBehavior();
}
