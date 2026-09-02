import { useTranslation } from "../../hooks/useTranslation";
export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  return { title: t("library.title"), description: t("library.description") };
}
