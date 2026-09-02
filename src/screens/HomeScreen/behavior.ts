import { useTranslation } from "../../hooks/useTranslation";
export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  return { title: t("home.title"), description: t("home.description") };
}
