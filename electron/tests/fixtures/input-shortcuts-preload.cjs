require("./time-signatures-preload.cjs");
const invoke = window.karaokaiDesktop.invoke;
window.karaokaiDesktop.invoke = async (command, args) => {
  const result = await invoke(command, args);
  if (
    command === "load_project" &&
    !result.tracks.some((track) => track.type === "subtitle")
  ) {
    result.tracks.push({
      id: "subtitle",
      type: "subtitle",
      name: "Lyrics",
      visible: true,
      locked: false,
      zIndex: 1,
      style: { scale: 1 },
      phrases: [
        {
          id: "phrase",
          start: 1000,
          end: 3000,
          text: "Hello world",
          style: { scale: 1 },
          words: [
            { id: "hello", text: "Hello", start: 1000, end: 2000 },
            { id: "world", text: "world", start: 2000, end: 3000 },
          ],
        },
      ],
    });
  }
  return result;
};
