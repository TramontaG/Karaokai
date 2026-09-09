import { useCallback } from "react";
import { type ProjectSort } from "../config/userPreferences";
import { useAppContext } from "./useAppContext";

export function useProjectSort() {
  const [data, setData] = useAppContext();
  const setProjectSort = useCallback(
    (projectSort: ProjectSort) => setData({ preferences: { projectSort } }),
    [setData]
  );

  return {
    projectSort: data.preferences.projectSort,
    setProjectSort,
  };
}
