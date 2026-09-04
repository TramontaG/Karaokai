import { getCurrentWindow } from "@tauri-apps/api/window";
import { useRouterState } from "@tanstack/react-router";
import { useCallback, type MouseEvent } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";

type WindowResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { theme, setThemePreference } = useTheme();
  const onToggleTheme = useCallback(() => {
    setThemePreference(theme.name === "dark" ? "light" : "dark");
  }, [setThemePreference, theme.name]);
  const onMinimize = useCallback(() => {
    void getCurrentWindow()
      .minimize()
      .catch(() => undefined);
  }, []);
  const onToggleMaximize = useCallback(() => {
    void getCurrentWindow()
      .toggleMaximize()
      .catch(() => undefined);
  }, []);
  const onClose = useCallback(() => {
    void getCurrentWindow()
      .close()
      .catch(() => undefined);
  }, []);
  const onStartDragging = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }

    void getCurrentWindow()
      .startDragging()
      .catch(() => undefined);
  }, []);
  const onStartResize = useCallback((event: MouseEvent<HTMLElement>) => {
    const direction = event.currentTarget.dataset.direction as
      WindowResizeDirection | undefined;
    if (event.button !== 0 || !direction) {
      return;
    }

    event.preventDefault();
    void getCurrentWindow()
      .startResizeDragging(direction)
      .catch(() => undefined);
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
    isDarkTheme: theme.name === "dark",
    isLightTheme: theme.name === "light",
    onToggleTheme,
    onMinimize,
    onToggleMaximize,
    onClose,
    onStartDragging,
    onStartResize,
  };
}
