import { useTranslation } from "../../hooks/useTranslation";
import { useAppContext } from "../../hooks/useAppContext";
export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const [data] = useAppContext();
  const labels = {
    waiting: t("bootstrap.loadingPreferences"),
    running: t("bootstrap.initializing"),
    ready: t("app.loading"),
    failed: t("bootstrap.failed"),
  };

  return { label: labels[data.bootstrap.status] };
}
