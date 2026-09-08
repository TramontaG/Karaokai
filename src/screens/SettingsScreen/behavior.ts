import { useCallback, type ChangeEvent } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useRecursiveState } from "../../hooks/useRecursiveState";
import { type Language } from "../../i18n/languagePacks";
import { type ThemePreference } from "../../theme";
import { useSound } from "../../hooks/useSound";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import { useDownloadedData } from "../../hooks/useDownloadedData";
import {
  chooseFontFile,
  importFontFile,
  removeFontFile,
} from "../../services/desktop";

type SettingsTab =
  "dependencies" | "models" | "general" | "appearance" | "storage" | "about";

interface SettingsState extends Record<string, unknown> {
  activeTab: SettingsTab;
}

export function useBehavior(_: Record<string, never>) {
  const [appData, setAppData] = useAppContext();
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
  const onAddCustomFont = useCallback(async () => {
    const sourcePath = await chooseFontFile();
    if (!sourcePath) return;
    const name =
      sourcePath
        .split(/[\\/]/)
        .pop()
        ?.replace(/\.[^.]+$/, "") ?? sourcePath;
    const path = await importFontFile(
      sourcePath,
      appData.preferences.storageDirectory
    );
    setAppData({
      preferences: {
        customFonts: [
          ...appData.preferences.customFonts,
          { id: `KaraokAI Custom ${crypto.randomUUID()}`, name, path },
        ],
      },
    });
  }, [
    appData.preferences.customFonts,
    appData.preferences.storageDirectory,
    setAppData,
  ]);
  const onRemoveCustomFont = useCallback(
    async (id: string) => {
      const font = appData.preferences.customFonts.find(
        (item) => item.id === id
      );
      if (font) {
        await removeFontFile(font.path, appData.preferences.storageDirectory);
      }
      setAppData({
        preferences: {
          customFonts: appData.preferences.customFonts.filter(
            (font) => font.id !== id
          ),
        },
      });
    },
    [
      appData.preferences.customFonts,
      appData.preferences.storageDirectory,
      setAppData,
    ]
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
    fontsTitle: t("settings.fonts.title"),
    fontsDescription: t("settings.fonts.description"),
    addFontLabel: t("settings.fonts.add"),
    removeFontLabel: t("settings.fonts.remove"),
    customFonts: appData.preferences.customFonts,
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
    onAddCustomFont: () => void onAddCustomFont(),
    onRemoveCustomFont: (id: string) => void onRemoveCustomFont(id),
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
