import {
  defaultPreferences,
  getSystemTheme,
  loadUserPreferences,
  type UserPreferences,
} from "../config/userPreferences";
import { type ThemeName } from "../theme";
import { createContext } from ".";
import { type ModelStatus } from "../services/models";

export interface BootstrapData {
  status: "waiting" | "running" | "ready" | "failed";
  dataDirectory: string | null;
  operatingSystem: string | null;
  architecture: string | null;
  runtimeProfile: "cpu" | "cuda" | null;
  error: string | null;
}
export interface OnboardingData {
  step: "welcome" | "storage" | "models" | "download" | "success";
  progress: number;
  selectedModelId: string;
  statusMessage: string | null;
  completedBytes: number;
  totalBytes: number | null;
  error: string | null;
  errorCode: string | null;
}

export interface CurrentProjectData {
  id: string;
  name: string;
}

export interface RequestedEditorAction {
  projectId: string;
  action: "export";
}

export interface AppData extends Record<string, unknown> {
  isLoading: boolean;
  preferencesLoaded: boolean;
  systemTheme: ThemeName;
  preferences: UserPreferences;
  models: ModelStatus[];
  currentProject: CurrentProjectData | null;
  requestedEditorAction: RequestedEditorAction | null;
  bootstrap: BootstrapData;
  onboarding: OnboardingData;
}
const initialData: AppData = {
  isLoading: true,
  preferencesLoaded: false,
  systemTheme: "dark",
  preferences: defaultPreferences,
  models: [],
  currentProject: null,
  requestedEditorAction: null,
  bootstrap: {
    status: "waiting",
    dataDirectory: null,
    operatingSystem: null,
    architecture: null,
    runtimeProfile: null,
    error: null,
  },
  onboarding: {
    step: "welcome",
    progress: 0,
    selectedModelId: "whisper-large-v3",
    statusMessage: null,
    completedBytes: 0,
    totalBytes: null,
    error: null,
    errorCode: null,
  },
};

export const appContext = createContext(initialData, () => ({
  preferencesLoaded: true,
  systemTheme: getSystemTheme(),
  preferences: loadUserPreferences(),
}));
