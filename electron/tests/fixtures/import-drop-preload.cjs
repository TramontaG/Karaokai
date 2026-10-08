const { webUtils } = require("electron");

window.importDropCalls = [];
window.karaokaiDesktop = {
  invoke: async (command, args) => {
    if (command === "bootstrap_app")
      return {
        runtimeReady: true,
        dataDirectory: "/tmp",
        directories: [],
        operatingSystem: "linux",
        architecture: "x64",
        runtimeProfile: "cpu",
        installedWhisperModelIds: [],
        installedDemucsModelIds: [],
      };
    if (command === "list_models" || command === "list_runtime_components")
      return [];
    if (command === "list_projects") return [];
    if (command === "create_local_project") {
      window.importDropCalls.push(args);
      return { id: "drop-test", name: "Drop Test" };
    }
    if (command === "load_project") return null;
    return null;
  },
  listen: () => () => {},
  send: () => {},
  filePath: (file) => webUtils.getPathForFile(file),
  chooseMediaFile: async () => null,
  windowAction: async () => {},
};
localStorage.setItem(
  "karaokai.user-preferences",
  JSON.stringify({
    language: "pt-BR",
    themePreference: "dark",
    onboardingCompleted: true,
  })
);
