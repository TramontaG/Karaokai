import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { type InstallProgress } from "../../services/models";
import { isDesktop, listenDesktop } from "../../services/desktop";
import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const [data, setData] = useAppContext();
  const [progress, setProgress] = useState<InstallProgress | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;
    let dispose: (() => void) | undefined;
    void listenDesktop<InstallProgress>("runtime-install-progress", (event) => {
      if (event.payload.jobId === "runtime-bootstrap") {
        setProgress(event.payload);
      }
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose?.();
  }, []);

  const labels = {
    waiting: t("bootstrap.loadingPreferences"),
    running: t("bootstrap.initializing"),
    ready: t("app.loading"),
    failed: t("bootstrap.failed"),
  };
  const error = data.bootstrap.error ?? progress?.error?.message ?? null;
  const retry = useCallback(() => {
    setProgress(null);
    setData({ bootstrap: { status: "waiting", error: null } });
  }, [setData]);

  return {
    label: labels[data.bootstrap.status],
    detail:
      progress?.stage === "installing" || progress?.stage === "downloading"
        ? progress.message
        : null,
    progress:
      progress?.stage === "installing" || progress?.stage === "downloading"
        ? Math.round(progress.progress)
        : null,
    error,
    retryLabel: t("bootstrap.retry"),
    retry,
  };
}
