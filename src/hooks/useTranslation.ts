import { useCallback, useEffect } from "react";
import {
  translate,
  type Language,
  type TranslationKey,
} from "../i18n/languagePacks";
import { useAppContext } from "./useAppContext";

export function useTranslation() {
  const [data, setData] = useAppContext();
  const language = data.preferences.language;
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "app.name");
  }, [language]);
  const setLanguage = useCallback(
    (next: Language) => setData({ preferences: { language: next } }),
    [setData]
  );
  return {
    language,
    setLanguage,
    t: (key: TranslationKey, values?: Record<string, string>) =>
      translate(language, key, values),
  };
}
