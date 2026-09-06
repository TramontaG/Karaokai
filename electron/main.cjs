const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const projects = require("./projects.cjs");
const runtime = require("./runtime.cjs");

const PROJECT_COMMANDS = new Set([
  "create_local_project",
  "load_project",
  "list_projects",
  "save_project",
  "delete_project",
  "project_audio_sources",
  "read_project_audio",
]);

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function defaultDataRoot() {
  if (process.platform === "linux") {
    return path.join(
      app.getPath("home"),
      ".local",
      "share",
      "com.karaokai.app"
    );
  }
  return path.join(app.getPath("appData"), "com.karaokai.app");
}

function dataRoot(storageDirectory) {
  return typeof storageDirectory === "string" && storageDirectory.trim()
    ? path.join(path.resolve(storageDirectory), "KaraokAI")
    : defaultDataRoot();
}

function emit(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed())
      window.webContents.send(`karaokai:event:${channel}`, payload);
  }
}

function nativeContext() {
  return {
    appPath: app.isPackaged ? process.resourcesPath : app.getAppPath(),
    dataRoot,
    emit,
    shell,
  };
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: "#10101a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      devTools: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.once("ready-to-show", () => window.show());
  window.webContents.on("did-finish-load", () => {
    if (!app.isPackaged) window.webContents.openDevTools({ mode: "detach" });
  });
  window.webContents.on("before-input-event", (event, input) => {
    const toggleDevTools =
      input.type === "keyDown" &&
      (input.key === "F12" ||
        ((input.control || input.meta) && input.shift && input.key === "I"));

    if (toggleDevTools) {
      event.preventDefault();
      window.webContents.toggleDevTools();
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url.startsWith("file:")
      : url.startsWith("http://127.0.0.1:1420") ||
        url.startsWith("http://localhost:1420");
    if (!allowed) event.preventDefault();
  });
  if (app.isPackaged) {
    void window.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    void window.loadURL("http://127.0.0.1:1420");
  }
}

ipcMain.handle("karaokai:invoke", async (_event, command, args = {}) => {
  if (PROJECT_COMMANDS.has(command))
    return projects.run(command, args, nativeContext());
  const result = await runtime.run(command, args, nativeContext());
  if (result !== undefined) return result;
  throw new Error(`Unknown native command: ${command}`);
});

ipcMain.handle("karaokai:dialog:audio", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Audio",
        extensions: ["mp3", "wav", "flac", "m4a", "aac", "ogg"],
      },
    ],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle("karaokai:dialog:directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.on("karaokai:window", (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;
  if (action === "minimize") window.minimize();
  if (action === "maximize")
    window.isMaximized() ? window.unmaximize() : window.maximize();
  if (action === "close") window.close();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
