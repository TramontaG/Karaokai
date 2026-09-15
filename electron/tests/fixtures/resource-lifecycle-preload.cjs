require("./playback-preload.cjs");
const invoke = window.karaokaiDesktop.invoke;
window.karaokaiDesktop.invoke = async (command, args) => {
  const result = await invoke(command, args);
  if (
    command === "load_project" &&
    !result.tracks.some((track) => track.id === "lyrics")
  ) {
    result.tracks.push({
      id: "lyrics",
      type: "subtitle",
      name: "Lyrics",
      visible: true,
      locked: false,
      zIndex: 1,
      style: {},
      phrases: [
        {
          id: "phrase",
          start: 0,
          end: 10000,
          text: "Sustained",
          words: [{ id: "word", text: "Sustained", start: 0, end: 10000 }],
        },
      ],
    });
  }
  return result;
};
const resources = (window.resources = {
  urls: new Map(),
  pointers: new Set(),
  subscriptions: new Set(),
});
const createUrl = URL.createObjectURL.bind(URL);
const revokeUrl = URL.revokeObjectURL.bind(URL);
URL.createObjectURL = (blob) => {
  const url = createUrl(blob);
  resources.urls.set(url, blob.type);
  return url;
};
URL.revokeObjectURL = (url) => {
  resources.urls.delete(url);
  revokeUrl(url);
};
window.karaokaiDesktop.listen = () => {
  const token = {};
  resources.subscriptions.add(token);
  return () => resources.subscriptions.delete(token);
};
const add = window.addEventListener.bind(window);
const remove = window.removeEventListener.bind(window);
window.addEventListener = (type, listener, options) => {
  if (["pointermove", "pointerup", "pointercancel"].includes(type)) {
    const entry = { type, listener };
    resources.pointers.add(entry);
    options?.signal?.addEventListener(
      "abort",
      () => resources.pointers.delete(entry),
      { once: true }
    );
  }
  add(type, listener, options);
};
window.removeEventListener = (type, listener, options) => {
  for (const entry of resources.pointers) {
    if (entry.type === type && entry.listener === listener)
      resources.pointers.delete(entry);
  }
  remove(type, listener, options);
};
