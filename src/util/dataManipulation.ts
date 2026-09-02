export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export function recursiveAssign<T extends Record<string, unknown>>(
  current: T,
  patch: DeepPartial<T>
): T {
  return Object.entries(patch).reduce<T>((result, [key, value]) => {
    const currentValue = result[key];
    const nextValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? recursiveAssign(
            (currentValue ?? {}) as Record<string, unknown>,
            value as Record<string, unknown>
          )
        : value;

    return { ...result, [key]: nextValue } as T;
  }, current);
}
