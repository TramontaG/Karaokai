interface DesktopBridge {
  renderJobId?: string;
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  send(channel: string, payload: unknown): void;
  listen<T>(channel: string, callback: (payload: T) => void): () => void;
  chooseAudioFile(): Promise<string | null>;
  chooseBackgroundFile(kind: "video" | "image"): Promise<string | null>;
  chooseDirectory(): Promise<string | null>;
  chooseVideoDestination(defaultPath: string): Promise<string | null>;
  filePath(file: File): string;
  windowAction(action: "minimize" | "maximize" | "close"): Promise<void>;
}

declare global {
  interface Window {
    karaokaiDesktop?: DesktopBridge;
  }
}

export const isDesktop = () => window.karaokaiDesktop !== undefined;
export const renderJobId = () => window.karaokaiDesktop?.renderJobId ?? null;
export const sendDesktop = (channel: string, payload: unknown) =>
  window.karaokaiDesktop?.send(channel, payload);

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
export const chooseBackgroundFile = (kind: "video" | "image") =>
  window.karaokaiDesktop?.chooseBackgroundFile(kind) ?? Promise.resolve(null);

export const chooseDirectory = () =>
  window.karaokaiDesktop?.chooseDirectory() ?? Promise.resolve(null);
export const chooseVideoDestination = (defaultPath: string) =>
  window.karaokaiDesktop?.chooseVideoDestination(defaultPath) ??
  Promise.resolve(null);

export const desktopFilePath = (file: File) =>
  window.karaokaiDesktop?.filePath(file) ?? "";

export const windowAction = (action: "minimize" | "maximize" | "close") =>
  window.karaokaiDesktop?.windowAction(action) ?? Promise.resolve();
