import { useCallback, useEffect, type ChangeEvent } from "react";
import { useAppContext } from "../../../../hooks/useAppContext";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useTranslation } from "../../../../hooks/useTranslation";
import {
  isDesktop,
  removeYoutubeCookies,
  saveYoutubeCookies,
  youtubeCookiesStatus,
} from "../../../../services/desktop";

interface YoutubeCookiesState extends Record<string, unknown> {
  configured: boolean;
  error: "invalidFormat" | "removeError" | "saveError" | "statusError" | null;
  loading: boolean;
  saving: boolean;
  value: string;
}

function isNetscapeCookieFile(value: string) {
  return value.split(/\r?\n/).some((line) => {
    const cookieLine = line.startsWith("#HttpOnly_")
      ? line.slice("#HttpOnly_".length)
      : line;
    return !cookieLine.startsWith("#") && cookieLine.split("\t").length >= 7;
  });
}

export function useBehavior(_: Record<string, never>) {
  const [appData] = useAppContext();
  const { t } = useTranslation();
  const [state, setState] = useRecursiveState<YoutubeCookiesState>({
    configured: false,
    error: null,
    loading: isDesktop(),
    saving: false,
    value: "",
  });
  const storageDirectory = appData.preferences.storageDirectory;
  const available = isDesktop();

  useEffect(() => {
    if (!available) return;
    let active = true;
    void youtubeCookiesStatus(storageDirectory)
      .then(({ configured }) => {
        if (active) setState({ configured, loading: false });
      })
      .catch(() => {
        if (active) {
          setState({
            error: "statusError",
            loading: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [available, setState, storageDirectory]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      setState({ error: null, value: event.target.value }),
    [setState]
  );
  const onSave = useCallback(async () => {
    const value = state.value.trim();
    if (!isNetscapeCookieFile(value)) {
      setState({ error: "invalidFormat" });
      return;
    }
    setState({ error: null, saving: true });
    try {
      await saveYoutubeCookies(value, storageDirectory);
      setState({ configured: true, saving: false, value: "" });
    } catch {
      setState({
        error: "saveError",
        saving: false,
      });
    }
  }, [setState, state.value, storageDirectory, t]);
  const onRemove = useCallback(async () => {
    setState({ error: null, saving: true });
    try {
      await removeYoutubeCookies(storageDirectory);
      setState({ configured: false, saving: false, value: "" });
    } catch {
      setState({
        error: "removeError",
        saving: false,
      });
    }
  }, [setState, storageDirectory, t]);

  return {
    actionLabel: t(
      state.configured
        ? "settings.youtubeCookies.replace"
        : "settings.youtubeCookies.save"
    ),
    available,
    canSave: Boolean(state.value.trim()) && !state.saving,
    configured: state.configured,
    configuredLabel: t("settings.youtubeCookies.configured"),
    description: t("settings.youtubeCookies.description"),
    error: state.error
      ? {
          invalidFormat: t("settings.youtubeCookies.invalidFormat"),
          removeError: t("settings.youtubeCookies.removeError"),
          saveError: t("settings.youtubeCookies.saveError"),
          statusError: t("settings.youtubeCookies.statusError"),
        }[state.error]
      : null,
    inputLabel: t("settings.youtubeCookies.inputLabel"),
    loading: state.loading,
    loadingLabel: t("settings.youtubeCookies.loading"),
    placeholder: t("settings.youtubeCookies.placeholder"),
    privacy: t("settings.youtubeCookies.privacy"),
    removeLabel: t("settings.youtubeCookies.remove"),
    saving: state.saving,
    title: t("settings.youtubeCookies.title"),
    unavailableLabel: t("settings.youtubeCookies.unavailable"),
    value: state.value,
    onChange,
    onRemove: () => void onRemove(),
    onSave: () => void onSave(),
  };
}
