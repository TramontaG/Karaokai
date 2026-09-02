import { useCallback, useEffect } from "react";
import { getSystemTheme } from "../config/userPreferences";
import { themes, type ThemeName, type ThemePreference } from "../theme";
import { useAppContext } from "./useAppContext";

export function useTheme() {
  const [data, setData] = useAppContext();
  const preference = data.preferences.themePreference;
  const activeTheme: ThemeName =
    preference === "system" ? data.systemTheme : preference;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setData({ systemTheme: getSystemTheme() });
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [setData]);
  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme;
  }, [activeTheme]);
  const setThemePreference = useCallback(
    (next: ThemePreference) =>
      setData({ preferences: { themePreference: next } }),
    [setData]
  );
  return {
    theme: themes[activeTheme],
    themePreference: preference,
    setThemePreference,
  };
}
