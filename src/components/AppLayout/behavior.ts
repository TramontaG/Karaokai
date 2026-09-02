import { useTranslation } from "../../hooks/useTranslation";
export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  return {
    appName: t("app.name"),
    navigationLabel: t("navigation.label"),
    home: t("navigation.home"),
    library: t("navigation.library"),
    models: t("navigation.models"),
    settings: t("navigation.settings"),
  };
}
