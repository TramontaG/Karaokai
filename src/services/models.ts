import { invoke, isTauri } from "@tauri-apps/api/core";

export interface ModelStatus {
  id: string;
  name: string;
  category: string;
  kind: "whisper" | "demucs";
  sizeLabel: string;
  installed: boolean;
  downloading?: boolean;
  progress?: number;
}
export interface InstallProgress {
  jobId: string;
  componentId: string;
  stage: "started" | "downloading" | "installing" | "completed" | "failed";
  progress: number;
  completedBytes: number;
  totalBytes: number | null;
  message: string;
  error: {
    code: string;
    stage: string;
    recoverable: boolean;
    message: string;
  } | null;
}
const previewModels: ModelStatus[] = [
  {
    id: "whisper-tiny",
    name: "Whisper Tiny",
    category: "Speech Recognition",
    kind: "whisper",
    sizeLabel: "~78 MB",
    installed: true,
  },
  {
    id: "whisper-base",
    name: "Whisper Base",
    category: "Speech Recognition",
    kind: "whisper",
    sizeLabel: "~145 MB",
    installed: true,
  },
  {
    id: "whisper-small",
    name: "Whisper Small",
    category: "Speech Recognition",
    kind: "whisper",
    sizeLabel: "~465 MB",
    installed: false,
  },
  {
    id: "whisper-medium",
    name: "Whisper Medium",
    category: "Speech Recognition",
    kind: "whisper",
    sizeLabel: "~1.5 GB",
    installed: false,
  },
  {
    id: "whisper-large-v3",
    name: "Whisper Large v3",
    category: "Speech Recognition",
    kind: "whisper",
    sizeLabel: "~3.1 GB",
    installed: false,
  },
  {
    id: "demucs-htdemucs",
    name: "HTDemucs",
    category: "Stem Separation",
    kind: "demucs",
    sizeLabel: "~80 MB",
    installed: true,
  },
  {
    id: "demucs-htdemucs-ft",
    name: "HTDemucs Fine-tuned",
    category: "Stem Separation",
    kind: "demucs",
    sizeLabel: "~320 MB",
    installed: false,
  },
  {
    id: "demucs-mdx-extra",
    name: "MDX Extra",
    category: "Stem Separation",
    kind: "demucs",
    sizeLabel: "~160 MB",
    installed: false,
  },
];
export const getModels = (storageDirectory: string | null) =>
  isTauri()
    ? invoke<ModelStatus[]>("list_models", { storageDirectory })
    : Promise.resolve(previewModels);
export const downloadModel = (
  modelId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<string>("start_model_download", { modelId, storageDirectory })
    : Promise.resolve(`preview-${modelId}`);
export const installRuntime = (
  modelId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<string>("start_runtime_install", { modelId, storageDirectory })
    : Promise.resolve("preview-runtime-bootstrap");
export const clearDownloadedData = (storageDirectory: string | null) =>
  isTauri()
    ? invoke<void>("clear_downloaded_data", { storageDirectory })
    : Promise.resolve();

export const removeModel = (
  modelId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<void>("remove_model", { modelId, storageDirectory })
    : Promise.resolve();
