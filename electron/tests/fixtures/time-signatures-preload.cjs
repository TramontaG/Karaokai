const fixture = {
  version: 1,
  id: "signature-test",
  name: "Signature Test",
  createdAt: "1",
  updatedAt: "1",
  duration: 16000,
  tempo: { bpm: 120, offset: 0 },
  processing: [],
  tracks: [
    {
      id: "background-main",
      type: "background",
      name: "Background",
      visible: true,
      locked: false,
      zIndex: -10,
      preset: "solid",
      color: "#182030",
    },
    {
      id: "audio-main",
      type: "audio",
      name: "Audio",
      visible: true,
      locked: false,
      zIndex: 0,
      duration: 16000,
      volume: 1,
      vocalsVolume: 0,
    },
  ],
};
let project =
  JSON.parse(localStorage.getItem("signature-test-project") || "null") ||
  fixture;
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
    if (command === "list_projects") return [{ ...project, sizeBytes: 0 }];
    if (command === "load_project") return structuredClone(project);
    if (command === "save_project") {
      project = structuredClone(args.project);
      localStorage.setItem("signature-test-project", JSON.stringify(project));
      return;
    }
    if (command === "project_audio_sources")
      return { instrumental: null, vocals: null };
    if (command === "extract_album_art") return null;
    if (command === "read_project_thumbnail") return null;
    if (command === "save_project_thumbnail") return;
    console.log("UNMOCKED " + command);
    return null;
  },
  listen: () => () => {},
  send: () => {},
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
