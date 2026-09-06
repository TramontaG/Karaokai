const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("karaokaiDesktop", {
  renderJobId: process.argv
    .find((argument) => argument.startsWith("--karaokai-render-job="))
    ?.slice("--karaokai-render-job=".length),
  invoke: (command, args) =>
    ipcRenderer.invoke("karaokai:invoke", command, args),
  send: (channel, payload) => ipcRenderer.send(`karaokai:${channel}`, payload),
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
  chooseVideoDestination: (defaultPath) =>
    ipcRenderer.invoke("karaokai:dialog:video-destination", defaultPath),
  filePath: (file) => webUtils.getPathForFile(file),
  windowAction: (action) => ipcRenderer.invoke("karaokai:window", action),
});
