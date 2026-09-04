import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef } from "react";
import {
  downloadModel,
  getModels,
  removeModel,
  type InstallProgress,
  type ModelStatus,
} from "../services/models";
import { useAppContext } from "./useAppContext";

export function useModels() {
  const [data, setData] = useAppContext();
  const storageDirectory = data.preferences.storageDirectory;
  const modelsRef = useRef(data.models);
  modelsRef.current = data.models;

  const refresh = useCallback(async () => {
    const models = await getModels(storageDirectory);
    modelsRef.current = models;
    setData({ models });
  }, [setData, storageDirectory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void listen<InstallProgress>("runtime-install-progress", (event) => {
      const { componentId, progress, stage } = event.payload;
      const currentModels = modelsRef.current;
      if (!currentModels.some((model) => model.id === componentId)) {
        return;
      }

      const models = currentModels.map((model) =>
        model.id === componentId
          ? {
              ...model,
              downloading:
                stage === "started" ||
                stage === "downloading" ||
                stage === "installing",
              progress: Math.round(progress),
            }
          : model
      );
      modelsRef.current = models;
      setData({
        models,
      });
      if (stage === "completed" || stage === "failed") {
        void refresh();
      }
    }).then((dispose) => {
      if (disposed) {
        dispose();
        return;
      }
      unlisten = dispose;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [refresh, setData]);

  const download = useCallback(
    async (model: ModelStatus) => {
      const models = modelsRef.current.map((item) =>
        item.id === model.id
          ? { ...item, downloading: true, progress: 0 }
          : item
      );
      modelsRef.current = models;
      setData({
        models,
      });
      try {
        await downloadModel(model.id, storageDirectory);
      } catch (error) {
        const restoredModels = modelsRef.current.map((item) =>
          item.id === model.id
            ? { ...item, downloading: false, progress: 0 }
            : item
        );
        modelsRef.current = restoredModels;
        setData({ models: restoredModels });
        throw error;
      }
    },
    [setData, storageDirectory]
  );

  const remove = useCallback(
    async (modelId: string) => {
      await removeModel(modelId, storageDirectory);
      await refresh();
    },
    [refresh, storageDirectory]
  );

  return { models: data.models, download, remove, refresh };
}
