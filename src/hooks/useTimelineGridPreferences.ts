import { useCallback } from "react";
import type { TimelineSubdivision } from "../config/userPreferences";
import { useAppContext } from "./useAppContext";

export function useTimelineGridPreferences() {
  const [data, setData] = useAppContext();
  const setTimelineSubdivision = useCallback(
    (value: number) => {
      if (![4, 8, 16, 32].includes(value)) return;
      setData({
        preferences: { timelineSubdivision: value as TimelineSubdivision },
      });
    },
    [setData]
  );
  const setTimelineSnapToGrid = useCallback(
    (timelineSnapToGrid: boolean) => {
      setData({ preferences: { timelineSnapToGrid } });
    },
    [setData]
  );
  return {
    timelineSubdivision: data.preferences.timelineSubdivision,
    timelineSnapToGrid: data.preferences.timelineSnapToGrid,
    setTimelineSubdivision,
    setTimelineSnapToGrid,
  };
}
