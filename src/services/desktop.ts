interface DesktopBridge {
  renderJobId?: string;
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  send(channel: string, payload: unknown): void;
  listen<T>(channel: string, callback: (payload: T) => void): () => void;
  chooseAudioFile(): Promise<string | null>;
  chooseBackgroundFile(kind: "video" | "image"): Promise<string | null>;
  chooseFontFile(): Promise<string | null>;
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
export const chooseFontFile = () =>
  window.karaokaiDesktop?.chooseFontFile() ?? Promise.resolve(null);

export async function readFontFile(path: string) {
  if (!isDesktop()) return null;
  const bytes = await invokeDesktop<number[]>("read_font_file", { path });
  return new Uint8Array(bytes);
}

export async function importFontFile(
  sourcePath: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) return sourcePath;
  return invokeDesktop<string>("import_font_file", {
    sourcePath,
    storageDirectory,
  });
}

export async function removeFontFile(
  path: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) return;
  await invokeDesktop<void>("remove_font_file", { path, storageDirectory });
}

export interface YoutubeCookiesStatus {
  configured: boolean;
}

export async function youtubeCookiesStatus(storageDirectory: string | null) {
  if (!isDesktop()) return { configured: false };
  return invokeDesktop<YoutubeCookiesStatus>("youtube_cookies_status", {
    storageDirectory,
  });
}

export async function saveYoutubeCookies(
  cookies: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) throw new Error("Desktop bridge is unavailable");
  await invokeDesktop<void>("save_youtube_cookies", {
    cookies,
    storageDirectory,
  });
}

export async function removeYoutubeCookies(storageDirectory: string | null) {
  if (!isDesktop()) return;
  await invokeDesktop<void>("remove_youtube_cookies", { storageDirectory });
}

export const chooseDirectory = () =>
  window.karaokaiDesktop?.chooseDirectory() ?? Promise.resolve(null);
export const chooseVideoDestination = (defaultPath: string) =>
  window.karaokaiDesktop?.chooseVideoDestination(defaultPath) ??
  Promise.resolve(null);

export const desktopFilePath = (file: File) =>
  window.karaokaiDesktop?.filePath(file) ?? "";

export const windowAction = (action: "minimize" | "maximize" | "close") =>
  window.karaokaiDesktop?.windowAction(action) ?? Promise.resolve();
