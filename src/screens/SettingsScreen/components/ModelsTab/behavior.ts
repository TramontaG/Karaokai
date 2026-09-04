import { createElement, useCallback, useEffect } from "react";
import { useAppContext } from "../../../../hooks/useAppContext";
import { useDefaultModels } from "../../../../hooks/useDefaultModels";
import { useModels } from "../../../../hooks/useModels";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type ModelStatus } from "../../../../services/models";
import { openManagedLocation } from "../../../../services/runtime";
import { ModelRow } from "../ModelRow";
import { type ModelAction } from "../ModelRow/behavior";

interface ModelsTabState extends Record<string, unknown> {
  openMenuId: string | null;
  detailsId: string | null;
}

interface ModelMetadata {
  accuracy: number;
  speed: number;
  vram: string;
}

const metadata: Record<string, ModelMetadata> = {
  "whisper-tiny": { accuracy: 2, speed: 5, vram: "~1 GB" },
  "whisper-base": { accuracy: 3, speed: 5, vram: "~1 GB" },
  "whisper-small": { accuracy: 4, speed: 4, vram: "~2 GB" },
  "whisper-medium": { accuracy: 4, speed: 3, vram: "~3 GB" },
  "whisper-large-v3": { accuracy: 5, speed: 2, vram: "~5 GB" },
  "demucs-htdemucs": { accuracy: 4, speed: 4, vram: "~3 GB" },
  "demucs-htdemucs-ft": { accuracy: 5, speed: 2, vram: "~4 GB" },
  "demucs-mdx-extra": { accuracy: 4, speed: 3, vram: "~3 GB" },
};

function formatRating(value: number) {
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

export function useBehavior(_: Record<string, never>) {
  const [appData] = useAppContext();
  const { t } = useTranslation();
  const { models, download, remove, refresh } = useModels();
  const defaults = useDefaultModels();
  const [state, setState] = useRecursiveState<ModelsTabState>({
    openMenuId: null,
    detailsId: null,
  });
  const whisperModels = models.filter((model) => model.kind === "whisper");
  const demucsModels = models.filter((model) => model.kind === "demucs");
  const selectedModel = models.find((model) => model.id === state.detailsId);
  const selectedMetadata = metadata[selectedModel?.id ?? ""] ?? {
    accuracy: 0,
    speed: 0,
    vram: t("settings.details.notAvailable"),
  };
  const selectedBackend =
    selectedModel?.kind === "whisper"
      ? "faster-whisper / CTranslate2"
      : "Demucs / PyTorch";
  const selectedModelType =
    selectedModel?.kind === "whisper"
      ? t("settings.models.type.transcription")
      : t("settings.models.type.separation");
  const selectedPath = `${appData.bootstrap.dataDirectory ?? "~/.local/share/KaraokAI"}/models/${selectedModel?.kind ?? ""}/${selectedModel?.id ?? ""}`;

  const isDefaultModel = useCallback(
    (model: ModelStatus) =>
      model.kind === "whisper"
        ? model.id === defaults.defaultWhisperModelId
        : model.id === defaults.defaultDemucsModelId,
    [defaults.defaultDemucsModelId, defaults.defaultWhisperModelId]
  );
  const onToggleMenu = useCallback(
    (modelId: string) => {
      setState({
        openMenuId: state.openMenuId === modelId ? null : modelId,
      });
    },
    [setState, state.openMenuId]
  );
  const onAction = useCallback(
    async (modelId: string, action: ModelAction) => {
      const model = models.find((item) => item.id === modelId);
      setState({ openMenuId: null });
      if (!model) return;

      if (action === "details") {
        setState({ detailsId: modelId });
      }
      if (action === "set-default") {
        if (model.kind === "whisper") {
          defaults.setDefaultWhisperModelId(modelId);
        } else {
          defaults.setDefaultDemucsModelId(modelId);
        }
      }
      if (action === "verify") {
        await refresh();
      }
      if (action === "open-folder") {
        await openManagedLocation(
          "model",
          modelId,
          appData.preferences.storageDirectory
        );
      }
      if (
        action === "remove" &&
        window.confirm(
          t("settings.models.removeConfirmation", { item: model.name })
        )
      ) {
        await remove(modelId);
      }
    },
    [
      appData.preferences.storageDirectory,
      defaults,
      models,
      refresh,
      remove,
      setState,
      t,
    ]
  );
  const onDownload = useCallback(
    (model: ModelStatus) => void download(model),
    [download]
  );
  const onCloseDetails = useCallback(
    () => setState({ detailsId: null }),
    [setState]
  );
  const renderModel = useCallback(
    (model: ModelStatus) =>
      createElement(ModelRow, {
        model,
        isDefault: isDefaultModel(model),
        menuOpen: state.openMenuId === model.id,
        onToggleMenu,
        onAction,
        onDownload,
      }),
    [isDefaultModel, onAction, onDownload, onToggleMenu, state.openMenuId]
  );
  const getModelId = useCallback((model: ModelStatus) => model.id, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-settings-actions]")) {
        setState({ openMenuId: null });
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [setState]);

  return {
    title: t("settings.models.title"),
    description: t("settings.models.description"),
    whisperTitle: t("settings.models.whisper"),
    demucsTitle: t("settings.models.demucs"),
    whisperModels,
    demucsModels,
    selectedName: selectedModel?.name ?? "",
    selectedTypeLabel: t("settings.models.details.type"),
    selectedType: selectedModelType,
    selectedSizeLabel: t("settings.details.size"),
    selectedSize: selectedModel?.sizeLabel ?? "",
    selectedAccuracyLabel: t("settings.models.details.accuracy"),
    selectedAccuracy: formatRating(selectedMetadata.accuracy),
    selectedSpeedLabel: t("settings.models.details.speed"),
    selectedSpeed: formatRating(selectedMetadata.speed),
    selectedVramLabel: t("settings.models.details.vram"),
    selectedVram: selectedMetadata.vram,
    selectedLanguagesLabel:
      selectedModel?.kind === "whisper"
        ? t("settings.models.details.languages")
        : t("settings.models.details.outputs"),
    selectedLanguages:
      selectedModel?.kind === "whisper"
        ? t("settings.models.details.multilingual")
        : t("settings.models.details.stems"),
    selectedPathLabel: t("settings.details.installedAt"),
    selectedPath,
    backendLabel: t("settings.models.details.backend"),
    selectedBackend,
    detailsOpen: selectedModel !== undefined,
    closeLabel: t("settings.details.close"),
    onCloseDetails,
    getModelId,
    renderModel,
  };
}
