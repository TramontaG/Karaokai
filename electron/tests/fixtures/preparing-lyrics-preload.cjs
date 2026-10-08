const project = {
  id: "lyrics-test",
  name: "Artist - Song",
  artist: "Artist",
  song: "Song",
  metadataConfirmed: true,
  processing: [
    { id: "import", status: "completed" },
    { id: "separation", status: "running", progress: 79 },
    { id: "transcription", status: "pending" },
    { id: "subtitles", status: "pending" },
  ],
};
let attempts = 0;
window.karaokaiDesktop = {
  invoke: async (command) => {
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
    if (command === "create_local_project") return project;
    if (command === "load_project") return structuredClone(project);
    if (command === "lookup_project_lyrics")
      return {
        id: 1,
        artist: "Artist",
        song: "Song",
        plainLyrics: "A sample lyric",
        syncedLyrics: "[00:01.00]A sample lyric",
      };
    if (command === "continue_project_processing") {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (attempts === 1) throw new Error("Could not start alignment");
      setTimeout(() => {
        project.processing[1] = { id: "separation", status: "completed" };
        project.processing[2] = {
          id: "transcription",
          status: "running",
          progress: 12,
        };
      }, 1200);
      return null;
    }
    return null;
  },
  listen: () => () => {},
  send: () => {},
  filePath: () => "/tmp/sample.wav",
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
