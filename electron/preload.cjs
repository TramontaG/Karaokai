const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("karaokaiDesktop", {
  invoke: (command, args) =>
    ipcRenderer.invoke("karaokai:invoke", command, args),
  listen: (channel, callback) => {
    const eventName = `karaokai:event:${channel}`;
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(eventName, listener);
    return () => ipcRenderer.removeListener(eventName, listener);
  },
  chooseAudioFile: () => ipcRenderer.invoke("karaokai:dialog:audio"),
  chooseBackgroundFile: (kind) =>
    ipcRenderer.invoke("karaokai:dialog:background", kind),
  chooseDirectory: () => ipcRenderer.invoke("karaokai:dialog:directory"),
  filePath: (file) => webUtils.getPathForFile(file),
  windowAction: (action) => ipcRenderer.send("karaokai:window", action),
});
