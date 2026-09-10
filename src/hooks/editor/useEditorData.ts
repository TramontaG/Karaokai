import { useCallback, useEffect } from "react";
import { appContext } from "../../context/AppContext";
import { initialEditorData, type EditorData } from "../../context/EditorData";
import type { RecursiveStateUpdate } from "../useRecursiveState";

export function useEditorData() {
  const [data, setValue] = appContext.useContext((value) => value.editor);
  const setData = useCallback(
    (patch: RecursiveStateUpdate<EditorData>) => {
      setValue((current) => ({
        editor: typeof patch === "function" ? patch(current.editor) : patch,
      }));
    },
    [setValue]
  );
  return [data, setData] as const;
}

// Match the lifetime of the former EditorStateProvider: reset on leaving the
// editor, not on changing projectId within the same mounted editor screen.
export function useEditorDataLifetime() {
  const [, setData] = useEditorData();
  useEffect(() => () => setData(initialEditorData), [setData]);
}
