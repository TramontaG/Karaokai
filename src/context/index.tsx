import {
  createContext as createReactContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  useRecursiveState,
  type RecursiveStateUpdate,
} from "../hooks/useRecursiveState";
import type { DeepPartial } from "../util/dataManipulation";

interface DataStore<TData> {
  getSnapshot: () => TData;
  subscribe: (listener: () => void) => () => void;
  publish: (data: TData) => void;
  setValue: (patch: RecursiveStateUpdate<TData>) => void;
}

function createDataStore<TData>(
  initialData: TData,
  setValue: DataStore<TData>["setValue"]
): DataStore<TData> {
  let snapshot = initialData;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    setValue,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish: (data) => {
      if (Object.is(snapshot, data)) return;
      snapshot = data;
      listeners.forEach((listener) => listener());
    },
  };
}

export function createContext<TData extends Record<string, unknown>>(
  initialData: TData,
  initialize?: () => DeepPartial<TData>
) {
  const ReactContext = createReactContext<DataStore<TData> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [value, setValue] = useRecursiveState(initialData);
    const storeRef = useRef<DataStore<TData> | null>(null);
    if (!storeRef.current) storeRef.current = createDataStore(value, setValue);
    const store = storeRef.current;

    useEffect(() => {
      setValue((initialize?.() ?? {}) as DeepPartial<TData>);
    }, [setValue]);
    useLayoutEffect(() => store.publish(value), [store, value]);

    return (
      <ReactContext.Provider value={store}>{children}</ReactContext.Provider>
    );
  }

  function useCustomContext<TSelection = TData>(
    selector: (data: TData) => TSelection = (data) =>
      data as unknown as TSelection
  ) {
    const store = useContext(ReactContext);
    if (!store) throw new Error("Context must be used inside its provider");
    const selection = useSyncExternalStore(
      store.subscribe,
      () => selector(store.getSnapshot()),
      () => selector(store.getSnapshot())
    );
    return [selection, store.setValue] as const;
  }

  return { Provider, useContext: useCustomContext };
}
