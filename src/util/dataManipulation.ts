export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export function recursiveAssign<T extends Record<string, unknown>>(
  current: T,
  patch: DeepPartial<T>
): T {
  let result = current;

  Object.entries(patch).forEach(([key, value]) => {
    const currentValue = current[key];
    const nextValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? recursiveAssign(
            (currentValue ?? {}) as Record<string, unknown>,
            value as Record<string, unknown>
          )
        : value;

    if (Object.is(currentValue, nextValue)) return;
    result = { ...result, [key]: nextValue } as T;
  });

  return result;
}
