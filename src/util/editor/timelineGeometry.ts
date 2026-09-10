export function subtitleTrackIdAtPosition(clientY: number) {
  const lanes = document.querySelectorAll<HTMLElement>(
    "[data-subtitle-track-id]"
  );
  const target = [...lanes].find((lane) => {
    const bounds = lane.getBoundingClientRect();
    return clientY >= bounds.top && clientY <= bounds.bottom;
  });
  return target?.dataset.subtitleTrackId ?? null;
}
