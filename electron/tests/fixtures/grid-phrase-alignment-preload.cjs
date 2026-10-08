require("./input-shortcuts-preload.cjs");

const invoke = window.karaokaiDesktop.invoke;
let prepared = false;
window.karaokaiDesktop.invoke = async (command, args) => {
  const result = await invoke(command, args);
  if (command === "load_project" && !prepared) {
    prepared = true;
    const track = result.tracks.find((item) => item.type === "subtitle");
    track.phrases[0] = {
      ...track.phrases[0],
      start: 1050,
      end: 2950,
      words: [
        { id: "hello", text: "Hello", start: 1050, end: 1900 },
        { id: "world", text: "world", start: 2100, end: 2950 },
      ],
    };
    track.phrases.push({
      id: "second-phrase",
      start: 4100,
      end: 4820,
      text: "Again",
      words: [{ id: "again", text: "Again", start: 4100, end: 4820 }],
    });
  }
  return result;
};
