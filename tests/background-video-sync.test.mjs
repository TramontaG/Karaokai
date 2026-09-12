import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/util/editor/backgroundVideoSync.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { createBackgroundVideoSync } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

function createVideo(overrides = {}) {
  let time = 0;
  const events = new Map();
  return {
    duration: 20,
    loop: true,
    readyState: 4,
    seeking: false,
    paused: false,
    error: null,
    playbackRate: 1,
    seeks: [],
    playCalls: 0,
    get currentTime() {
      return time;
    },
    set currentTime(value) {
      time = value;
      this.seeks.push(value);
    },
    play() {
      this.playCalls++;
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
    addEventListener(type, listener) {
      events.set(type, listener);
    },
    dispatchEvent(type) {
      events.get(type)?.();
    },
    ...overrides,
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("small drift changes playback speed without interrupting decoding", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo();
  sync(video, 0.2, true, false, 0);
  assert.deepEqual(video.seeks, []);
  assert.ok(video.playbackRate > 1 && video.playbackRate <= 1.05);
});

test("periodic sync never replaces an unfinished seek", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo();
  sync(video, 5, true, false, 0);
  video.seeking = true;
  for (let now = 125; now <= 3000; now += 125) {
    sync(video, 5 + now / 1000, true, false, now);
  }
  assert.deepEqual(video.seeks, [5]);
  video.seeking = false;
  sync(video, 8, true, false, 3125);
  assert.deepEqual(video.seeks, [5, 8]);
});

test("large drift corrections have a cooldown", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo();
  sync(video, 5, true, false, 0);
  sync(video, 7, true, false, 125);
  assert.deepEqual(video.seeks, [5]);
  sync(video, 8, true, false, 1000);
  assert.deepEqual(video.seeks, [5, 8]);
});

test("an explicit seek waits for an unfinished seek and then applies the latest target", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo({ readyState: 1, seeking: true });
  sync(video, 5, true, false, 0);
  assert.deepEqual(video.seeks, []);
  sync(video, 8, true, true, 125);
  assert.deepEqual(video.seeks, []);
  video.seeking = false;
  sync(video, 8, true, false, 250);
  assert.deepEqual(video.seeks, [8]);
});

test("the seeked event applies a queued seek while playback is otherwise idle", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo({ seeking: true, paused: true });
  sync(video, 8, false, true, 0);
  video.seeking = false;
  video.dispatchEvent("seeked");
  assert.deepEqual(video.seeks, [8]);

  sync(video, 5, false, true, 125);
  video.seeking = true;
  sync(video, 8, false, true, 250);
  video.seeking = false;
  video.dispatchEvent("seeked");
  assert.deepEqual(video.seeks, [8, 5, 8]);
});

test("loop boundary drift uses the shortest distance", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo();
  video.currentTime = 19.95;
  video.seeks.length = 0;
  sync(video, 20.05, true, false, 0);
  assert.deepEqual(video.seeks, []);
  assert.ok(video.playbackRate > 1);
  sync(video, 45, true, true, 125);
  assert.deepEqual(video.seeks, [5]);
});

test("resumes paused video and waits for the pending play request", async () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo({ paused: true });
  let resolvePlay;
  video.play = () => {
    video.playCalls++;
    return new Promise((resolve) => {
      resolvePlay = resolve;
    });
  };
  sync(video, 0, true, false, 0);
  sync(video, 0, true, false, 2000);
  assert.equal(video.playCalls, 1);
  resolvePlay();
  await settle();
  sync(video, 0, true, false, 3000);
  assert.equal(video.playCalls, 2);
  resolvePlay();
  await settle();
});

test("interrupted play can retry without rapid repeated requests", async () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo({ paused: true });
  video.play = () => {
    video.playCalls++;
    return Promise.reject(new DOMException("Interrupted", "AbortError"));
  };
  sync(video, 0, true, false, 0);
  await settle();
  sync(video, 0, true, false, 125);
  assert.equal(video.playCalls, 1);
  sync(video, 0, true, false, 1000);
  await settle();
  assert.equal(video.playCalls, 2);
});

test("paused audio does not restart video and missing metadata is deferred", () => {
  const sync = createBackgroundVideoSync();
  const video = createVideo();
  sync(video, 5, false, true, 0);
  assert.equal(video.paused, true);
  assert.equal(video.playCalls, 0);
  const loading = createVideo({ readyState: 0, paused: true });
  sync(loading, 5, true, true, 0);
  assert.deepEqual(loading.seeks, []);
  assert.equal(loading.playCalls, 0);
});
