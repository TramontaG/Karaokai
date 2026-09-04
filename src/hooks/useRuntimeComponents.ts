import { useCallback, useEffect } from "react";
import {
  getRuntimeComponents,
  installRuntimeComponent,
  openManagedLocation,
  removeRuntimeComponent,
  runRuntimeCheckup,
  type RuntimeComponentStatus,
} from "../services/runtime";
import { useAppContext } from "./useAppContext";
import { useRecursiveState } from "./useRecursiveState";

interface RuntimeComponentsState extends Record<string, unknown> {
  components: RuntimeComponentStatus[];
  checking: boolean;
  checkupCompleted: boolean;
  error: string | null;
  installingComponentId: string | null;
}

export function useRuntimeComponents() {
  const [data] = useAppContext();
  const [state, setState] = useRecursiveState<RuntimeComponentsState>({
    components: [],
    checking: false,
    checkupCompleted: false,
    error: null,
    installingComponentId: null,
  });
  const storageDirectory = data.preferences.storageDirectory;

  const refresh = useCallback(async () => {
    try {
      const components = await getRuntimeComponents(storageDirectory);
      setState({ components, error: null });
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [setState, storageDirectory]);

  const checkup = useCallback(async () => {
    setState({ checking: true, checkupCompleted: false, error: null });
    try {
      const components = await runRuntimeCheckup(storageDirectory);
      setState({ components, checking: false, checkupCompleted: true });
    } catch (error) {
      setState({
        checking: false,
        checkupCompleted: true,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [setState, storageDirectory]);

  const openLocation = useCallback(
    (targetKind: "dependency" | "model", targetId: string) =>
      openManagedLocation(targetKind, targetId, storageDirectory),
    [storageDirectory]
  );

  const install = useCallback(
    async (componentId: string) => {
      setState({ installingComponentId: componentId, error: null });
      try {
        await installRuntimeComponent(componentId, storageDirectory);
        await refresh();
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setState({ installingComponentId: null });
      }
    },
    [refresh, setState, storageDirectory]
  );

  const remove = useCallback(
    async (componentId: string) => {
      await removeRuntimeComponent(componentId, storageDirectory);
      await refresh();
    },
    [refresh, storageDirectory]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    components: state.components,
    checking: state.checking,
    checkupCompleted: state.checkupCompleted,
    error: state.error,
    installingComponentId: state.installingComponentId,
    refresh,
    checkup,
    openLocation,
    install,
    remove,
  };
}
