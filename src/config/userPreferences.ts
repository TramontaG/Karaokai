import { languages, type Language } from "../i18n/languagePacks";
import { type ThemeName, type ThemePreference } from "../theme";

const STORAGE_KEY = "karaokai.user-preferences";
export interface UserPreferences {
  language: Language;
  themePreference: ThemePreference;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  storageDirectory: string | null;
}
export const defaultPreferences: UserPreferences = {
  language: "pt-BR",
  themePreference: "system",
  soundEnabled: true,
  onboardingCompleted: false,
  storageDirectory: null,
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
    };
  } catch {
    return defaultPreferences;
  }
}

export function saveUserPreferences(preferences: UserPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
