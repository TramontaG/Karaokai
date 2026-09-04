import { createElement, useCallback, useEffect } from "react";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import { useRuntimeComponents } from "../../../../hooks/useRuntimeComponents";
import { useTranslation } from "../../../../hooks/useTranslation";
import { type RuntimeComponentStatus } from "../../../../services/runtime";
import { DependencyRow } from "../DependencyRow";
import { type DependencyAction } from "../DependencyRow/behavior";

interface DependenciesTabState extends Record<string, unknown> {
  openMenuId: string | null;
  detailsId: string | null;
}

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const runtime = useRuntimeComponents();
  const [state, setState] = useRecursiveState<DependenciesTabState>({
    openMenuId: null,
    detailsId: null,
  });
  const selectedComponent = runtime.components.find(
    (component) => component.id === state.detailsId
  );
  const allHealthy = runtime.components.every(
    (component) => component.installed && component.verified
  );

  const onToggleMenu = useCallback(
    (componentId: string) => {
      setState({
        openMenuId: state.openMenuId === componentId ? null : componentId,
      });
    },
    [setState, state.openMenuId]
  );
  const onRunCheckup = useCallback(async () => {
    await runtime.checkup();
  }, [runtime]);
  const onAction = useCallback(
    async (componentId: string, action: DependencyAction) => {
      const component = runtime.components.find(
        (item) => item.id === componentId
      );
      setState({ openMenuId: null });
      if (!component) return;

      if (action === "details") {
        setState({ detailsId: componentId });
      }
      if (action === "install") {
        await runtime.install(componentId);
      }
      if (action === "open-folder") {
        await runtime.openLocation("dependency", componentId);
      }
      if (action === "verify" || action === "updates") {
        await runtime.checkup();
      }
      if (
        action === "remove" &&
        window.confirm(
          t("settings.dependencies.removeConfirmation", {
            item: component.name,
          })
        )
      ) {
        await runtime.remove(componentId);
      }
    },
    [runtime, setState, t]
  );
  const onCloseDetails = useCallback(
    () => setState({ detailsId: null }),
    [setState]
  );
  const renderComponent = useCallback(
    (component: RuntimeComponentStatus) =>
      createElement(DependencyRow, {
        component,
        menuOpen: state.openMenuId === component.id,
        installing: runtime.installingComponentId === component.id,
        onToggleMenu,
        onAction,
      }),
    [onAction, onToggleMenu, state.openMenuId]
  );
  const getComponentId = useCallback(
    (component: RuntimeComponentStatus) => component.id,
    []
  );

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-settings-actions]")) {
        setState({ openMenuId: null });
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [setState]);

  return {
    title: t("settings.dependencies.title"),
    description: t("settings.dependencies.description"),
    checkupLabel: runtime.checking
      ? t("settings.checkup.running")
      : t("settings.checkup.action"),
    checkupResult: allHealthy
      ? t("settings.checkup.healthy")
      : t("settings.checkup.issues"),
    hasCheckupResult: runtime.checkupCompleted,
    hasError: runtime.error !== null,
    error: runtime.error ?? "",
    checking: runtime.checking,
    components: runtime.components,
    selectedName: selectedComponent?.name ?? "",
    installedVersionLabel: t("settings.details.installedVersion"),
    installedVersion:
      selectedComponent?.installedVersion ??
      t("settings.dependencies.unknownVersion"),
    availableVersionLabel: t("settings.details.availableVersion"),
    availableVersion: selectedComponent?.availableVersion ?? "",
    platformLabel: t("settings.details.platform"),
    platform: selectedComponent?.platform ?? "",
    sizeLabel: t("settings.details.size"),
    size: selectedComponent?.sizeLabel ?? "",
    installedAtLabel: t("settings.details.installedAt"),
    installedAt: selectedComponent?.installPath ?? "",
    checksumLabel: t("settings.details.sha256"),
    checksum: selectedComponent?.sha256 ?? t("settings.details.notAvailable"),
    statusLabel: t("settings.details.status"),
    status: selectedComponent?.verified
      ? t("settings.status.verified")
      : t("settings.status.notVerified"),
    detailsVerified: selectedComponent?.verified === true,
    detailsNotVerified: selectedComponent?.verified !== true,
    detailsOpen: selectedComponent !== undefined,
    closeLabel: t("settings.details.close"),
    onRunCheckup,
    onCloseDetails,
    getComponentId,
    renderComponent,
  };
}
