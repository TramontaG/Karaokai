import { useCallback } from "react";
import { appContext, type AppData } from "../context/AppContext";
import type { RecursiveStateUpdate } from "./useRecursiveState";

export function useAppContext() {
  const [data, setValue] = appContext.useContext((value) => value.app);
  const setData = useCallback(
    (patch: RecursiveStateUpdate<AppData>) => {
      setValue((current) => ({
        app: typeof patch === "function" ? patch(current.app) : patch,
      }));
    },
    [setValue]
  );
  return [data, setData] as const;
}
