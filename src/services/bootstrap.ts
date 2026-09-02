import { invoke, isTauri } from "@tauri-apps/api/core";

export interface BootstrapReport {
  dataDirectory: string;
  directories: string[];
  operatingSystem: string;
  architecture: string;
  runtimeProfile: "cpu";
}

const browserPreviewReport: BootstrapReport = {
  dataDirectory: "browser-preview",
  directories: [],
  operatingSystem: "browser",
  architecture: "unknown",
  runtimeProfile: "cpu",
};

export async function bootstrapApplication(
  storageDirectory: string | null
): Promise<BootstrapReport> {
  return isTauri()
    ? invoke<BootstrapReport>("bootstrap_app", { storageDirectory })
    : browserPreviewReport;
}
