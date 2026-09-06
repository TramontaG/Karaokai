interface DesktopBridge {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  listen<T>(channel: string, callback: (payload: T) => void): () => void;
  chooseAudioFile(): Promise<string | null>;
  chooseDirectory(): Promise<string | null>;
  filePath(file: File): string;
  windowAction(action: "minimize" | "maximize" | "close"): void;
}

declare global {
  interface Window {
    karaokaiDesktop?: DesktopBridge;
  }
}

export const isDesktop = () => window.karaokaiDesktop !== undefined;

export function invokeDesktop<T>(
  command: string,
  args?: Record<string, unknown>
) {
  const bridge = window.karaokaiDesktop;
  if (!bridge)
    return Promise.reject(new Error("Desktop bridge is unavailable"));
  return bridge.invoke<T>(command, args);
}

export function listenDesktop<T>(
  channel: string,
  callback: (event: { payload: T }) => void
) {
  const dispose = window.karaokaiDesktop?.listen<T>(channel, (payload) =>
    callback({ payload })
  );
  return Promise.resolve(dispose ?? (() => undefined));
}

export const chooseAudioFile = () =>
  window.karaokaiDesktop?.chooseAudioFile() ?? Promise.resolve(null);

export const chooseDirectory = () =>
  window.karaokaiDesktop?.chooseDirectory() ?? Promise.resolve(null);

export const desktopFilePath = (file: File) =>
  window.karaokaiDesktop?.filePath(file) ?? "";

export const windowAction = (action: "minimize" | "maximize" | "close") =>
  window.karaokaiDesktop?.windowAction(action);
