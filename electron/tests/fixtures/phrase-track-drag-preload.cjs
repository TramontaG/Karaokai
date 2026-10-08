require("./time-signatures-preload.cjs");

const invoke = window.karaokaiDesktop.invoke;
window.karaokaiDesktop.invoke = async (command, args) => {
  const result = await invoke(command, args);
  if (command !== "load_project") return result;
  if (result.tracks.some((track) => track.id === "source-track")) return result;
  const phrase = (id, text, start, end) => ({
    id,
    text,
    start,
    end,
    words: [{ id: `${id}-word`, text, start, end }],
  });
  result.tracks.push(
    {
      id: "source-track",
      type: "subtitle",
      name: "Source",
      visible: true,
      locked: false,
      zIndex: 1,
      style: {},
      phrases: [
        phrase("alpha", "Alpha", 1000, 3000),
        phrase("beta", "Beta", 4000, 6000),
      ],
    },
    {
      id: "target-track",
      type: "subtitle",
      name: "Target",
      visible: true,
      locked: false,
      zIndex: 2,
      style: {},
      phrases: [],
    }
  );
  return result;
};
