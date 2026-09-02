import { useTranslation } from "../../hooks/useTranslation";
export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  return { label: t("app.loading") };
}
