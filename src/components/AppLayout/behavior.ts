import { useRouterState } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import { windowAction } from "../../services/desktop";
import { saveProjectBeforeWindowClose } from "../../services/projectWindowLifecycle";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const [data] = useAppContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isEditorRoute = /^\/projects\/[^/]+\/editor$/.test(normalizedPathname);
  const { theme, setThemePreference } = useTheme();
  const closingRef = useRef(false);
  const onToggleTheme = useCallback(() => {
    setThemePreference(theme.name === "dark" ? "light" : "dark");
  }, [setThemePreference, theme.name]);
  const onMinimize = useCallback(() => {
    void windowAction("minimize");
  }, []);
  const onToggleMaximize = useCallback(() => {
    void windowAction("maximize");
  }, []);
  const onClose = useCallback(async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      await saveProjectBeforeWindowClose();
      await windowAction("close");
    } finally {
      closingRef.current = false;
    }
  }, []);

  return {
    brandName: t("app.name.prefix"),
    brandAccent: t("app.name.accent"),
    navigationLabel: t("navigation.label"),
    home: t("navigation.home"),
    library: t("navigation.library"),
    editor: data.currentProject?.name ?? t("navigation.editor"),
    editorProjectId: data.currentProject?.id ?? null,
    editorLabel: data.currentProject
      ? t("navigation.editorProject", { project: data.currentProject.name })
      : t("navigation.editorUnavailable"),
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
