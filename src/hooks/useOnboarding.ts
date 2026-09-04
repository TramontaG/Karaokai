import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";
import { bootstrapApplication } from "../services/bootstrap";
import { installRuntime, type InstallProgress } from "../services/models";
import { selectStorageDirectory } from "../services/storage";
import { useAppContext } from "./useAppContext";
import { useDownloadedData } from "./useDownloadedData";
import { useModels } from "./useModels";

export function useOnboarding() {
  const [data, setData] = useAppContext();
  const { models, refresh } = useModels();
  const { removeDownloads } = useDownloadedData();

  useEffect(() => {
    if (!isTauri()) return;
    let dispose: (() => void) | undefined;
    void listen<InstallProgress>("runtime-install-progress", (event) => {
      const progress = event.payload;
      if (progress.jobId !== "runtime-bootstrap") return;
      if (
        progress.stage === "completed" &&
        progress.componentId === "runtime"
      ) {
        setData({
          onboarding: {
            step: "success",
            progress: 100,
            statusMessage: progress.message,
            completedBytes: progress.completedBytes,
            totalBytes: progress.totalBytes,
            error: null,
            errorCode: null,
          },
        });
        void refresh();
      }
      if (progress.stage === "failed") {
        setData({
          onboarding: {
            step: "download",
            statusMessage: progress.componentId,
            error: progress.error?.message ?? progress.message,
            errorCode: progress.error?.code ?? "DOWNLOAD_FAILED",
          },
        });
      }
      if (
        progress.stage === "started" ||
        progress.stage === "downloading" ||
        progress.stage === "installing"
      ) {
        setData({
          onboarding: {
            step: "download",
            progress: Math.round(progress.progress),
            statusMessage: progress.componentId,
            completedBytes: progress.completedBytes,
            totalBytes: progress.totalBytes,
            error: null,
            errorCode: null,
          },
        });
      }
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose?.();
  }, [data.onboarding.selectedModelId, refresh, setData]);

  const getStarted = useCallback(
    () =>
      setData({
        onboarding: { step: "storage", error: null, errorCode: null },
      }),
    [setData]
  );

  const setStorageDirectory = useCallback(
    async (storageDirectory: string | null) => {
      try {
        const report = await bootstrapApplication(storageDirectory);
        setData({
          preferences: { storageDirectory },
          bootstrap: {
            status: "ready",
            dataDirectory: report.dataDirectory,
            operatingSystem: report.operatingSystem,
            architecture: report.architecture,
            runtimeProfile: report.runtimeProfile,
            error: null,
          },
          onboarding: { step: "models", error: null, errorCode: null },
        });
        void refresh();
      } catch (error) {
        setData({
          onboarding: {
            error: error instanceof Error ? error.message : String(error),
            errorCode: "STORAGE_UNAVAILABLE",
          },
        });
      }
    },
    [refresh, setData]
  );

  const useDefaultStorage = useCallback(
    () => void setStorageDirectory(null),
    [setStorageDirectory]
  );

  const chooseStorageDirectory = useCallback(async () => {
    const directory = await selectStorageDirectory();
    if (directory) {
      await setStorageDirectory(directory);
    }
  }, [setStorageDirectory]);

  const selectModel = useCallback(
    (modelId: string) => setData({ onboarding: { selectedModelId: modelId } }),
    [setData]
  );

  const download = useCallback(async () => {
    const modelId = data.onboarding.selectedModelId;
    setData({
      onboarding: {
        step: "download",
        progress: 1,
        statusMessage: "uv",
        completedBytes: 0,
        totalBytes: null,
        error: null,
        errorCode: null,
      },
    });
    try {
      await installRuntime(modelId, data.preferences.storageDirectory);
      if (!isTauri()) {
        setData({
          onboarding: {
            step: "success",
            progress: 100,
            statusMessage: "runtime",
            error: null,
            errorCode: null,
          },
        });
      }
    } catch (error) {
      setData({
        onboarding: {
          step: "download",
          error: error instanceof Error ? error.message : String(error),
          errorCode: "DOWNLOAD_FAILED",
        },
      });
    }
  }, [
    data.onboarding.selectedModelId,
    data.preferences.storageDirectory,
    setData,
  ]);

  const finish = useCallback(
    () => setData({ preferences: { onboardingCompleted: true } }),
    [setData]
  );

  return {
    onboarding: data.onboarding,
    models,
    storageDirectory: data.preferences.storageDirectory,
    completed: data.preferences.onboardingCompleted,
    getStarted,
    useDefaultStorage,
    chooseStorageDirectory,
    selectModel,
    download,
    finish,
    removeDownloads,
  };
}
