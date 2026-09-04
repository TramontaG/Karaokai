import { invoke, isTauri } from "@tauri-apps/api/core";

export interface RuntimeComponentStatus {
  id: "ffmpeg" | "ml-worker" | "yt-dlp";
  name: string;
  installed: boolean;
  installedVersion: string | null;
  availableVersion: string;
  platform: string;
  sizeLabel: string;
  installPath: string;
  sha256: string | null;
  verified: boolean;
  updateAvailable: boolean;
}

const previewComponents: RuntimeComponentStatus[] = [
  {
    id: "ffmpeg",
    name: "FFmpeg",
    installed: true,
    installedVersion: "7.0.2",
    availableVersion: "7.0.2",
    platform: "linux-x64",
    sizeLabel: "~78 MB",
    installPath: "~/.local/share/KaraokAI/runtime/ffmpeg/ffmpeg",
    sha256: "74c8f2a39a8b14b8a915cc28550b5fe4",
    verified: true,
    updateAvailable: false,
  },
  {
    id: "ml-worker",
    name: "ML Worker",
    installed: true,
    installedVersion: "0.1.0",
    availableVersion: "0.1.0",
    platform: "linux-x64 (CPU)",
    sizeLabel: "~1.2 GB",
    installPath: "~/.local/share/KaraokAI/runtime/python-environment",
    sha256: "9e61205abf13fd37bf3c709e81a7d2d0",
    verified: true,
    updateAvailable: false,
  },
  {
    id: "yt-dlp",
    name: "yt-dlp",
    installed: true,
    installedVersion: "2026.8.19",
    availableVersion: "2026.8.19",
    platform: "linux-x64",
    sizeLabel: "~20 MB",
    installPath: "~/.local/share/KaraokAI/runtime/python-environment",
    sha256: null,
    verified: true,
    updateAvailable: false,
  },
];

export const getRuntimeComponents = (storageDirectory: string | null) =>
  isTauri()
    ? invoke<RuntimeComponentStatus[]>("list_runtime_components", {
        storageDirectory,
      })
    : Promise.resolve(previewComponents);

export const runRuntimeCheckup = (storageDirectory: string | null) =>
  isTauri()
    ? invoke<RuntimeComponentStatus[]>("run_runtime_checkup", {
        storageDirectory,
      })
    : Promise.resolve(previewComponents);

export const installRuntimeComponent = (
  componentId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<void>("install_runtime_component", {
        componentId,
        storageDirectory,
      })
    : Promise.resolve();

export const openManagedLocation = (
  targetKind: "dependency" | "model",
  targetId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<void>("open_managed_location", {
        targetKind,
        targetId,
        storageDirectory,
      })
    : Promise.resolve();

export const removeRuntimeComponent = (
  componentId: string,
  storageDirectory: string | null
) =>
  isTauri()
    ? invoke<void>("remove_runtime_component", {
        componentId,
        storageDirectory,
      })
    : Promise.resolve();
