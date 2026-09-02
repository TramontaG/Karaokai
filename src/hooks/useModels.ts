import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";
import {
  downloadModel,
  getModels,
  type InstallProgress,
  type ModelStatus,
} from "../services/models";
import { useAppContext } from "./useAppContext";

export function useModels() {
  const [data, setData] = useAppContext();
  const storageDirectory = data.preferences.storageDirectory;

  const refresh = useCallback(async () => {
    const models = await getModels(storageDirectory);
    setData({ models });
  }, [setData, storageDirectory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    void listen<InstallProgress>("runtime-install-progress", (event) => {
      const { componentId, stage } = event.payload;
      if (stage === "completed" || stage === "failed") {
        void refresh();
      }
      setData({
        models: data.models.map((model) =>
          model.id === componentId
            ? {
                ...model,
                downloading:
                  stage === "started" ||
                  stage === "downloading" ||
                  stage === "installing",
              }
            : model
        ),
      });
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, [data.models, refresh, setData]);

  const download = useCallback(
    async (model: ModelStatus) => {
      setData({
        models: data.models.map((item) =>
          item.id === model.id ? { ...item, downloading: true } : item
        ),
      });
      await downloadModel(model.id, storageDirectory);
    },
    [data.models, setData, storageDirectory]
  );

  return { models: data.models, download, refresh };
}
