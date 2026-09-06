import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  return {
    titlePrefix: t("home.hero.titlePrefix"),
    titleHighlight: t("home.hero.titleHighlight"),
    description: t("home.hero.description"),
  };
}
