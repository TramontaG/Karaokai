// Isolated playback fixture. No installed models or user project files are used.
require("./time-signatures-preload.cjs");
const previousInvoke = window.karaokaiDesktop.invoke;
window.karaokaiDesktop.invoke = async (command, args) => {
  if (command === "load_project") {
    const p = await previousInvoke(command, args);
    p.duration = 180000;
    p.tempo = {
      bpm: 120,
      offset: 0,
      changes: [{ id: "tempo", time: 2000, bpm: 90 }],
      timeSignatures: [{ id: "sig", time: 4000, numerator: 3, denominator: 4 }],
    };
    return p;
  }
  if (command === "project_audio_sources")
    return { instrumental: "fixture", vocals: null };
  if (command === "read_project_audio") {
    const samples = 48000 * 10;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write("RIFF");
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(48000, 24);
    wav.writeUInt32LE(96000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(samples * 2, 40);
    return new Uint8Array(wav).buffer;
  }
  return previousInvoke(command, args);
};
const prefs = JSON.parse(localStorage.getItem("karaokai.user-preferences"));
prefs.timelineSubdivision = 32;
prefs.metronomeEnabled = process.argv.includes("--test-metronome");
prefs.metronomeVolume = 0;
localStorage.setItem("karaokai.user-preferences", JSON.stringify(prefs));
window.probe = {
  recording: false,
  commits: 0,
  timelineChanges: 0,
  gridChanges: 0,
  changes: {},
  frameIntervals: [],
};
let lastModel = null;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: true,
  inject: () => 1,
  onCommitFiberUnmount() {},
  onPostCommitFiberRoot() {},
  onCommitFiberRoot(_id, root) {
    if (!window.probe.recording) return;
    window.probe.commits++;
    const visit = (f) => {
      if (!f) return;
      const model = f.memoizedProps?.model;
      if (f.elementType?.displayName === "EditorTimeline" && model) {
        if (lastModel && lastModel !== model) {
          window.probe.timelineChanges++;
          if (lastModel.timelineGridLines !== model.timelineGridLines)
            window.probe.gridChanges++;
          for (const k of Object.keys(model)) {
            if (lastModel[k] !== model[k])
              window.probe.changes[k] = (window.probe.changes[k] || 0) + 1;
          }
        }
        lastModel = model;
      }
      visit(f.child);
      visit(f.sibling);
    };
    visit(root.current);
  },
};
