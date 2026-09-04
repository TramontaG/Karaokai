import { useCallback } from "react";
import { clearDownloadedData } from "../services/models";
import { useAppContext } from "./useAppContext";

export function useDownloadedData() {
  const [data, setData] = useAppContext();

  const removeDownloads = useCallback(async () => {
    await clearDownloadedData(data.preferences.storageDirectory);
    setData({
      preferences: { onboardingCompleted: false },
      onboarding: {
        step: "welcome",
        progress: 0,
        completedBytes: 0,
        totalBytes: null,
        error: null,
        errorCode: null,
      },
    });
  }, [data.preferences.storageDirectory, setData]);

  return { removeDownloads };
}
