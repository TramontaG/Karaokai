export const formatTime = (milliseconds: number) =>
  new Date(Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0))
    .toISOString()
    .slice(14, 23);

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
