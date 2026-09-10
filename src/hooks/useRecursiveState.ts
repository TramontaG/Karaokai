import { useCallback, useState } from "react";
import { type DeepPartial, recursiveAssign } from "../util/dataManipulation";

export type RecursiveStateUpdate<T> =
  DeepPartial<T> | ((current: T) => DeepPartial<T>);

export function useRecursiveState<T extends Record<string, unknown>>(
  initialValue: T
) {
  const [value, setValue] = useState(initialValue);
  const setRecursiveValue = useCallback((patch: RecursiveStateUpdate<T>) => {
    setValue((current) =>
      recursiveAssign(
        current,
        typeof patch === "function" ? patch(current) : patch
      )
    );
  }, []);

  return [value, setRecursiveValue] as const;
}
