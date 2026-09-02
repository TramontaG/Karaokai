import { ModelOption } from "./components/ModelOption";
import { createElement } from "react";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useTranslation } from "../../hooks/useTranslation";
import { type ModelStatus } from "../../services/models";

export function useBehavior(_: Record<string, never>) {
  const onboarding = useOnboarding();
  const { language, t } = useTranslation();
  const modelOptions = onboarding.models.map((model) => ({
    ...model,
    selected: model.id === onboarding.onboarding.selectedModelId,
  }));
  const errorMessage = (() => {
    if (onboarding.onboarding.error) {
      return t("onboarding.error.details", {
        details: onboarding.onboarding.error,
      });
    }
    return t("onboarding.error.download");
  })();
  const statusMessage = (() => {
    const componentId = onboarding.onboarding.statusMessage;
    if (componentId?.startsWith("whisper-")) {
      return t("onboarding.stage.whisper");
    }
    if (componentId === "ffmpeg") {
      return t("onboarding.stage.ffmpeg");
    }
    if (componentId === "ml-worker") {
      return t("onboarding.stage.worker");
    }
    if (componentId === "demucs-htdemucs") {
      return t("onboarding.stage.demucs");
    }
    if (componentId === "validating") {
      return t("onboarding.stage.validating");
    }
    if (componentId === "runtime") {
      return t("onboarding.stage.ready");
    }
    return t("onboarding.stage.manifest");
  })();
  const formatBytes = (bytes: number) => {
    const useGigabytes = bytes >= 1_000_000_000;
    const divisor = useGigabytes ? 1_000_000_000 : 1_000_000;
    return new Intl.NumberFormat(language, {
      style: "unit",
      unit: useGigabytes ? "gigabyte" : "megabyte",
      unitDisplay: "short",
      maximumFractionDigits: 1,
    }).format(bytes / divisor);
  };
  const progressDetails = (() => {
    const totalBytes = onboarding.onboarding.totalBytes;
    if (!totalBytes) return null;
    return t("onboarding.progress.bytes", {
      completed: formatBytes(onboarding.onboarding.completedBytes),
      total: formatBytes(totalBytes),
    });
  })();

  return {
    isWelcome: onboarding.onboarding.step === "welcome",
    isStorage: onboarding.onboarding.step === "storage",
    isModels: onboarding.onboarding.step === "models",
    isDownloading: onboarding.onboarding.step === "download",
    isSuccess: onboarding.onboarding.step === "success",
    hasError: onboarding.onboarding.error !== null,
    canRetryDownload: true,
    hasStatusMessage: onboarding.onboarding.statusMessage !== null,
    hasProgressDetails: progressDetails !== null,
    statusMessage,
    progressDetails,
    progress: onboarding.onboarding.progress,
    progressLabel: t("onboarding.progress", {
      progress: String(onboarding.onboarding.progress),
    }),
    storagePath:
      onboarding.storageDirectory ?? t("onboarding.storage.defaultPath"),
    modelOptions,
    modelId: (model: ModelStatus) => model.id,
    renderModel: (model: (typeof modelOptions)[number]) =>
      createElement(ModelOption, { model, onSelect: onboarding.selectModel }),
    downloadDisabled: modelOptions.length === 0,
    getStarted: onboarding.getStarted,
    useDefaultStorage: onboarding.useDefaultStorage,
    chooseStorageDirectory: onboarding.chooseStorageDirectory,
    download: onboarding.download,
    finish: onboarding.finish,
    errorMessage,
    welcomeTitle: t("onboarding.welcome.title"),
    welcomeDescription: t("onboarding.welcome.description"),
    getStartedLabel: t("onboarding.getStarted"),
    storageTitle: t("onboarding.storage.title"),
    storageDescription: t("onboarding.storage.description"),
    useDefaultStorageLabel: t("onboarding.storage.useDefault"),
    chooseStorageLabel: t("onboarding.storage.choose"),
    modelsTitle: t("onboarding.models.title"),
    modelsDescription: t("onboarding.models.description"),
    downloadLabel: t("onboarding.download"),
    retryLabel: t("onboarding.retry"),
    downloadingTitle: t("onboarding.download.title"),
    downloadingDescription: t("onboarding.download.description"),
    successTitle: t("onboarding.success.title"),
    successDescription: t("onboarding.success.description"),
    finishLabel: t("onboarding.finish"),
  };
}
