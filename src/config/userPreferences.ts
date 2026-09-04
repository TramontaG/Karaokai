import { languages, type Language } from "../i18n/languagePacks";
import { type ThemeName, type ThemePreference } from "../theme";

const STORAGE_KEY = "karaokai.user-preferences";
export type ProjectViewMode = "grid" | "list";

export interface UserPreferences {
  language: Language;
  themePreference: ThemePreference;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  storageDirectory: string | null;
  projectViewMode: ProjectViewMode;
  defaultWhisperModelId: string;
  defaultDemucsModelId: string;
}
export const defaultPreferences: UserPreferences = {
  language: "pt-BR",
  themePreference: "system",
  soundEnabled: true,
  onboardingCompleted: false,
  storageDirectory: null,
  projectViewMode: "grid",
  defaultWhisperModelId: "whisper-base",
  defaultDemucsModelId: "demucs-htdemucs",
};

export function getSystemTheme(): ThemeName {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : {};
    return {
      language: languages.includes(stored.language as Language)
        ? (stored.language as Language)
        : defaultPreferences.language,
      themePreference: ["system", "light", "dark"].includes(
        stored.themePreference ?? ""
      )
        ? (stored.themePreference as ThemePreference)
        : defaultPreferences.themePreference,
      soundEnabled:
        typeof stored.soundEnabled === "boolean"
          ? stored.soundEnabled
          : defaultPreferences.soundEnabled,
      onboardingCompleted:
        typeof stored.onboardingCompleted === "boolean"
          ? stored.onboardingCompleted
          : defaultPreferences.onboardingCompleted,
      storageDirectory:
        typeof stored.storageDirectory === "string" &&
        stored.storageDirectory.length > 0
          ? stored.storageDirectory
          : defaultPreferences.storageDirectory,
      projectViewMode: ["grid", "list"].includes(stored.projectViewMode ?? "")
        ? (stored.projectViewMode as ProjectViewMode)
        : defaultPreferences.projectViewMode,
      defaultWhisperModelId:
        typeof stored.defaultWhisperModelId === "string"
          ? stored.defaultWhisperModelId
          : defaultPreferences.defaultWhisperModelId,
      defaultDemucsModelId:
        typeof stored.defaultDemucsModelId === "string"
          ? stored.defaultDemucsModelId
          : defaultPreferences.defaultDemucsModelId,
    };
  } catch {
    return defaultPreferences;
  }
}

export function saveUserPreferences(preferences: UserPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
