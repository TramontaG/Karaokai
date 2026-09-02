import {
  createContext as createReactContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useRecursiveState } from "../hooks/useRecursiveState";
import { type DeepPartial } from "../util/dataManipulation";

interface ContextValue<TData extends Record<string, unknown>> {
  value: TData;
  setValue: (patch: DeepPartial<TData>) => void;
}

export function createContext<TData extends Record<string, unknown>>(
  initialData: TData,
  initialize?: () => DeepPartial<TData>
) {
  const ReactContext = createReactContext<ContextValue<TData> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [value, setValue] = useRecursiveState(initialData);

    useEffect(() => {
      setValue((initialize?.() ?? {}) as DeepPartial<TData>);
    }, [setValue]);

    return (
      <ReactContext.Provider value={{ value, setValue }}>
        {children}
      </ReactContext.Provider>
    );
  }

  function useCustomContext() {
    const context = useContext(ReactContext);

    if (!context) {
      throw new Error("Context must be used inside its provider");
    }

    return [context.value, context.setValue] as const;
  }

  return { Provider, useContext: useCustomContext };
}
