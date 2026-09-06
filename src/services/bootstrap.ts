import { invokeDesktop, isDesktop } from "./desktop";

export interface BootstrapReport {
  dataDirectory: string;
  directories: string[];
  operatingSystem: string;
  architecture: string;
  runtimeProfile: "cpu" | "cuda";
  runtimeReady: boolean;
  installedWhisperModelIds: string[];
  installedDemucsModelIds: string[];
}

const browserPreviewReport: BootstrapReport = {
  dataDirectory: "browser-preview",
  directories: [],
  operatingSystem: "browser",
  architecture: "unknown",
  runtimeProfile: "cpu",
  runtimeReady: false,
  installedWhisperModelIds: [],
  installedDemucsModelIds: [],
};

export async function bootstrapApplication(
  storageDirectory: string | null
): Promise<BootstrapReport> {
  return isDesktop()
    ? invokeDesktop<BootstrapReport>("bootstrap_app", { storageDirectory })
    : browserPreviewReport;
}
