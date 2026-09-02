import { useCallback, type ChangeEvent } from "react";
import { type Language } from "../../i18n/languagePacks";
import { type ThemePreference } from "../../theme";
import { useSound } from "../../hooks/useSound";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import { useOnboarding } from "../../hooks/useOnboarding";
export function useBehavior(_: Record<string, never>) {
  const { language, setLanguage, t } = useTranslation();
  const { themePreference, setThemePreference } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSound();
  const { removeDownloads } = useOnboarding();
  const onRemoveDownloads = useCallback(() => {
    if (window.confirm(t("settings.removeDownloadsConfirmation"))) {
      void removeDownloads();
    }
  }, [removeDownloads, t]);
  const onLanguageChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setLanguage(event.target.value as Language),
    [setLanguage]
  );
  const onThemeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setThemePreference(event.target.value as ThemePreference),
    [setThemePreference]
  );
  const onSoundChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setSoundEnabled(event.target.checked),
    [setSoundEnabled]
  );
  return {
    title: t("settings.title"),
    description: t("settings.description"),
    languageLabel: t("settings.language"),
    themeLabel: t("settings.theme"),
    soundLabel: t("settings.sound"),
    portuguese: t("language.pt-BR"),
    english: t("language.en-US"),
    system: t("theme.system"),
    light: t("theme.light"),
    dark: t("theme.dark"),
    language,
    themePreference,
    soundEnabled,
    onLanguageChange,
    onThemeChange,
    onSoundChange,
    onRemoveDownloads,
    removeDownloadsLabel: t("settings.removeDownloads"),
  };
}
