import { useCallback, type ChangeEvent } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useRecursiveState } from "../../hooks/useRecursiveState";
import { type Language } from "../../i18n/languagePacks";
import { type ThemePreference } from "../../theme";
import { useSound } from "../../hooks/useSound";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import { useDownloadedData } from "../../hooks/useDownloadedData";

type SettingsTab =
  "dependencies" | "models" | "general" | "appearance" | "storage" | "about";

interface SettingsState extends Record<string, unknown> {
  activeTab: SettingsTab;
}

export function useBehavior(_: Record<string, never>) {
  const [appData] = useAppContext();
  const { language, setLanguage, t } = useTranslation();
  const { themePreference, setThemePreference } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSound();
  const { removeDownloads } = useDownloadedData();
  const [state, setState] = useRecursiveState<SettingsState>({
    activeTab: "dependencies",
  });
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
  const onShowDependencies = useCallback(
    () => setState({ activeTab: "dependencies" }),
    [setState]
  );
  const onShowModels = useCallback(
    () => setState({ activeTab: "models" }),
    [setState]
  );
  const onShowGeneral = useCallback(
    () => setState({ activeTab: "general" }),
    [setState]
  );
  const onShowAppearance = useCallback(
    () => setState({ activeTab: "appearance" }),
    [setState]
  );
  const onShowStorage = useCallback(
    () => setState({ activeTab: "storage" }),
    [setState]
  );
  const onShowAbout = useCallback(
    () => setState({ activeTab: "about" }),
    [setState]
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
    dependenciesTab: t("settings.tabs.dependencies"),
    modelsTab: t("settings.tabs.models"),
    generalTab: t("settings.tabs.general"),
    appearanceTab: t("settings.tabs.appearance"),
    storageTab: t("settings.tabs.storage"),
    aboutTab: t("settings.tabs.about"),
    tabsLabel: t("settings.tabs.label"),
    generalTitle: t("settings.general.title"),
    generalDescription: t("settings.general.description"),
    appearanceTitle: t("settings.appearance.title"),
    appearanceDescription: t("settings.appearance.description"),
    storageTitle: t("settings.storage.title"),
    storageDescription: t("settings.storage.description"),
    storagePathLabel: t("settings.storage.path"),
    storagePath:
      appData.bootstrap.dataDirectory ?? t("settings.storage.systemPath"),
    dangerTitle: t("settings.storage.clearTitle"),
    dangerDescription: t("settings.storage.clearDescription"),
    aboutTitle: t("settings.about.title"),
    aboutDescription: t("settings.about.description"),
    versionLabel: t("settings.about.version"),
    version: "0.1.0",
    privacyLabel: t("settings.about.privacy"),
    dependenciesActive: state.activeTab === "dependencies",
    modelsActive: state.activeTab === "models",
    generalActive: state.activeTab === "general",
    appearanceActive: state.activeTab === "appearance",
    storageActive: state.activeTab === "storage",
    aboutActive: state.activeTab === "about",
    onLanguageChange,
    onThemeChange,
    onSoundChange,
    onRemoveDownloads,
    onShowDependencies,
    onShowModels,
    onShowGeneral,
    onShowAppearance,
    onShowStorage,
    onShowAbout,
    removeDownloadsLabel: t("settings.removeDownloads"),
  };
}
