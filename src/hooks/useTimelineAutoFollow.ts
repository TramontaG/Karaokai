import { useCallback } from "react";
import { useAppContext } from "./useAppContext";

export function useTimelineAutoFollow() {
  const [data, setData] = useAppContext();
  const setTimelineAutoFollow = useCallback(
    (timelineAutoFollow: boolean) =>
      setData({ preferences: { timelineAutoFollow } }),
    [setData]
  );

  return {
    timelineAutoFollow: data.preferences.timelineAutoFollow,
    setTimelineAutoFollow,
  };
}
