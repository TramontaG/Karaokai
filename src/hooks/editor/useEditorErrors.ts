import { useCallback } from "react";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorRuntime: Pick<EditorRuntime, "errorTimerRef">;
  editorDataState: Pick<EditorDataState, "setError">;
}

export function useEditorErrors({ editorRuntime, editorDataState }: Options) {
  const { errorTimerRef } = editorRuntime;
  const { setError } = editorDataState;
  const showTemporaryError = useCallback(
    (message: string) => {
      if (errorTimerRef.current !== null)
        window.clearTimeout(errorTimerRef.current);
      setError(message);
      errorTimerRef.current = window.setTimeout(() => {
        errorTimerRef.current = null;
        setError(null);
      }, 6_000);
    },
    [setError]
  );
  return { showTemporaryError };
}

export type EditorErrors = ReturnType<typeof useEditorErrors>;
