import { useCallback, useState } from "react";
import { type DeepPartial, recursiveAssign } from "../util/dataManipulation";

export function useRecursiveState<T extends Record<string, unknown>>(
  initialValue: T
) {
  const [value, setValue] = useState(initialValue);
  const setRecursiveValue = useCallback((patch: DeepPartial<T>) => {
    setValue((current) => recursiveAssign(current, patch));
  }, []);

  return [value, setRecursiveValue] as const;
}
