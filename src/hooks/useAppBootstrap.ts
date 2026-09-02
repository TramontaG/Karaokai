import { useEffect } from "react";
import { saveUserPreferences } from "../config/userPreferences";
import { useAppContext } from "./useAppContext";
import { useTheme } from "./useTheme";
import { useTranslation } from "./useTranslation";

export function useAppBootstrap() {
  const [data] = useAppContext();
  const { theme } = useTheme();
  useTranslation();
  useEffect(() => {
    if (!data.isLoading) {
      saveUserPreferences(data.preferences);
    }
  }, [data.isLoading, data.preferences]);
  return { isLoading: data.isLoading, isReady: !data.isLoading, theme };
}
