let project = null;
window.trackPrefillCalls = [];
window.karaokaiDesktop = {
  invoke: async (command, args) => {
    window.trackPrefillCalls.push(command);
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
    if (command === "create_local_project") {
      const tagged = args.sourcePath.endsWith("/tagged.mp3");
      project = {
        id: "project-prefill-test",
        name: tagged ? "tagged" : "untagged",
        ...(tagged ? { artist: "Tagged Artist", song: "Tagged Song" } : {}),
        metadataConfirmed: false,
        processing: [
          { id: "import", status: "completed" },
          { id: "separation", status: "running" },
          { id: "transcription", status: "pending" },
          { id: "subtitles", status: "pending" },
        ],
      };
      return project;
    }
    if (command === "load_project") return project;
    return null;
  },
  listen: () => () => {},
  send: () => {},
  filePath: (file) => `/tmp/${file.name}`,
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
