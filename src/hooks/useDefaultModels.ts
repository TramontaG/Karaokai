import { useCallback } from "react";
import { useAppContext } from "./useAppContext";

export function useDefaultModels() {
  const [data, setData] = useAppContext();
  const setDefaultWhisperModelId = useCallback(
    (defaultWhisperModelId: string) =>
      setData({ preferences: { defaultWhisperModelId } }),
    [setData]
  );
  const setDefaultDemucsModelId = useCallback(
    (defaultDemucsModelId: string) =>
      setData({ preferences: { defaultDemucsModelId } }),
    [setData]
  );

  return {
    defaultWhisperModelId: data.preferences.defaultWhisperModelId,
    defaultDemucsModelId: data.preferences.defaultDemucsModelId,
    setDefaultWhisperModelId,
    setDefaultDemucsModelId,
  };
}
