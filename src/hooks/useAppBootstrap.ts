import { useEffect } from "react";
import { saveUserPreferences } from "../config/userPreferences";
import { bootstrapApplication } from "../services/bootstrap";
import { useAppContext } from "./useAppContext";
import { useTheme } from "./useTheme";
import { useTranslation } from "./useTranslation";

export function useAppBootstrap() {
  const [data, setData] = useAppContext();
  const { theme } = useTheme();
  useTranslation();

  useEffect(() => {
    if (!data.preferencesLoaded || data.bootstrap.status !== "waiting") {
      return;
    }

    const bootstrap = async () => {
      setData({ bootstrap: { status: "running" } });

      try {
        const report = await bootstrapApplication(
          data.preferences.storageDirectory
        );

        setData({
          isLoading: false,
          preferences: report.runtimeReady
            ? {
                onboardingCompleted: true,
                defaultWhisperModelId: report.installedWhisperModelIds.includes(
                  data.preferences.defaultWhisperModelId
                )
                  ? data.preferences.defaultWhisperModelId
                  : (report.installedWhisperModelIds.at(-1) ??
                    data.preferences.defaultWhisperModelId),
                defaultDemucsModelId: report.installedDemucsModelIds.includes(
                  data.preferences.defaultDemucsModelId
                )
                  ? data.preferences.defaultDemucsModelId
                  : (report.installedDemucsModelIds[0] ??
                    data.preferences.defaultDemucsModelId),
              }
            : { onboardingCompleted: false },
          bootstrap: {
            status: "ready",
            dataDirectory: report.dataDirectory,
            operatingSystem: report.operatingSystem,
            architecture: report.architecture,
            runtimeProfile: report.runtimeProfile,
            error: null,
          },
        });
      } catch (error) {
        setData({
          bootstrap: {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    };

    void bootstrap();
  }, [
    data.bootstrap.status,
    data.preferences.defaultDemucsModelId,
    data.preferences.defaultWhisperModelId,
    data.preferences.storageDirectory,
    data.preferencesLoaded,
    setData,
  ]);

  useEffect(() => {
    if (!data.isLoading && data.preferencesLoaded) {
      saveUserPreferences(data.preferences);
    }
  }, [data.isLoading, data.preferences]);
  return {
    isLoading: data.isLoading,
    isReady: !data.isLoading,
    theme,
  };
}
