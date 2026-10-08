require("./input-shortcuts-preload.cjs");

const invoke = window.karaokaiDesktop.invoke;
window.fineAlignmentCalls = [];
window.karaokaiDesktop.invoke = async (command, args) => {
  if (command === "project_audio_sources")
    return { instrumental: null, vocals: "test-vocals" };
  if (command === "read_project_audio") return new ArrayBuffer(44);
  if (command === "align_project_phrase") {
    window.fineAlignmentCalls.push(args);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const secondWordStart =
      window.fineAlignmentCalls.length === 1 ? 1760 : 2300;
    return {
      start: 1250,
      end: 2800,
      words: [
        { text: "Hello", start: 1250, end: 1700 },
        { text: "world", start: secondWordStart, end: 2800 },
      ],
    };
  }
  return invoke(command, args);
};
