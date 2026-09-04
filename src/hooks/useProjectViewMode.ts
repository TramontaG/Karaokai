import { useCallback } from "react";
import { type ProjectViewMode } from "../config/userPreferences";
import { useAppContext } from "./useAppContext";

export function useProjectViewMode() {
  const [data, setData] = useAppContext();
  const setProjectViewMode = useCallback(
    (projectViewMode: ProjectViewMode) =>
      setData({ preferences: { projectViewMode } }),
    [setData]
  );

  return {
    projectViewMode: data.preferences.projectViewMode,
    setProjectViewMode,
  };
}
