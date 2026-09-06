import { useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import { windowAction } from "../../services/desktop";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isEditorRoute = /^\/projects\/[^/]+\/editor$/.test(normalizedPathname);
  const { theme, setThemePreference } = useTheme();
  const onToggleTheme = useCallback(() => {
    setThemePreference(theme.name === "dark" ? "light" : "dark");
  }, [setThemePreference, theme.name]);
  const onMinimize = useCallback(() => {
    windowAction("minimize");
  }, []);
  const onToggleMaximize = useCallback(() => {
    windowAction("maximize");
  }, []);
  const onClose = useCallback(() => {
    windowAction("close");
  }, []);

  return {
    brandName: t("app.name.prefix"),
    brandAccent: t("app.name.accent"),
    navigationLabel: t("navigation.label"),
    home: t("navigation.home"),
    library: t("navigation.library"),
    settings: t("navigation.settings"),
    searchPlaceholder: t(
      pathname === "/settings"
        ? "appLayout.search.settingsPlaceholder"
        : "appLayout.search.placeholder"
    ),
    searchLabel: t("appLayout.search.label"),
    themeLabel: t("appLayout.theme.toggle"),
    minimizeLabel: t("appLayout.window.minimize"),
    maximizeLabel: t("appLayout.window.maximize"),
    closeLabel: t("appLayout.window.close"),
    storageLabel: t("appLayout.storage.label"),
    storageDescription: t("appLayout.storage.description"),
    isEditorRoute,
    isDarkTheme: theme.name === "dark",
    isLightTheme: theme.name === "light",
    onToggleTheme,
    onMinimize,
    onToggleMaximize,
    onClose,
  };
}
