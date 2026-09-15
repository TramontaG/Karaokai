import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function loadUtility(name) {
  const source = readFileSync(
    new URL(`../src/util/editor/${name}.ts`, import.meta.url),
    "utf8"
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const { createMetronome } = await loadUtility("metronome");
const { tempoGridLines } = await loadUtility("tempoGrid");

function fixture(t, lines = tempoGridLines(4000, 120, 0, 4)) {
  let tick;
  t.mock.method(globalThis, "setInterval", (callback) => {
    tick = callback;
    return 1;
  });
  t.mock.method(globalThis, "clearInterval", () => {});
  const media = Object.assign(new EventTarget(), {
    currentTime: 0,
    playbackRate: 1,
    paused: false,
    ended: false,
    seeking: false,
    readyState: 4,
  });
  const voices = [];
  const gains = [];
  const context = {
    currentTime: 10,
    state: "running",
    destination: {},
    resume: async () => {},
    createGain() {
      const gain = {
        value: 0,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime(value) {
          this.value = value;
        },
      };
      const node = { gain, connect() {}, disconnect() {} };
      gains.push(node);
      return node;
    },
    createOscillator() {
      const voice = {
        frequency: { value: 0 },
        connect() {},
        disconnect() {},
        start(at) {
          this.at = at;
        },
        stop(at) {
          if (at === undefined) this.cancelled = true;
        },
      };
      voices.push(voice);
      return voice;
    },
  };
  const metronome = createMetronome(media, context, lines, 50);
  t.after(() => metronome.dispose());
  return {
    media,
    context,
    voices,
    gains,
    metronome,
    tick: () => tick(),
    emit: (name) => media.dispatchEvent(new Event(name)),
  };
}

test("schedules distinct bar and subdivision tones on the media clock without duplicates", (t) => {
  const f = fixture(t);
  f.tick();
  assert.equal(f.voices[0].frequency.value, 1600);
  assert.equal(f.voices[0].at, 10);
  f.media.currentTime = 0.42;
  f.tick();
  assert.equal(f.voices[1].frequency.value, 800);
  assert.equal(f.voices[1].at, 10.08);
  f.tick();
  assert.equal(f.voices.length, 2);
  f.metronome.setVolume(0);
  assert.equal(f.gains[0].gain.value, 0);
});

test("cancels queued clicks on pause, seeking and buffering; resumes at the new grid position", (t) => {
  const f = fixture(t);
  f.tick();
  f.media.paused = true;
  f.emit("pause");
  assert.ok(f.voices.every((voice) => voice.cancelled));
  f.media.currentTime = 1.92;
  f.tick();
  assert.equal(f.voices.length, 1);
  f.media.paused = false;
  f.emit("playing");
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 1600);
  f.media.seeking = true;
  f.emit("seeking");
  assert.ok(f.voices.at(-1).cancelled);
  f.media.currentTime = 0.42;
  f.media.seeking = false;
  f.emit("seeked");
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 800);
  f.emit("waiting");
  const count = f.voices.length;
  f.tick();
  assert.equal(f.voices.length, count);
  assert.ok(f.voices.at(-1).cancelled);
});

test("honors offset, dense subdivisions and playback rate without replaying missed clicks", (t) => {
  const f = fixture(t, tempoGridLines(4000, 120, 250, 16));
  f.tick();
  assert.equal(f.voices[0].frequency.value, 800); // subdivision at zero before the bar anchor
  f.media.currentTime = 0.2;
  f.media.playbackRate = 2;
  f.emit("ratechange");
  f.tick();
  assert.equal(f.voices[1].frequency.value, 1600);
  assert.equal(f.voices[1].at, 10.025);
  assert.equal(f.voices[2].frequency.value, 800);
  f.media.currentTime = 3;
  const count = f.voices.length;
  f.tick();
  assert.ok(f.voices.length - count <= 2);
  f.metronome.dispose();
  const disposedCount = f.voices.length;
  f.emit("playing");
  f.tick();
  assert.equal(f.voices.length, disposedCount);
});

test("keeps the opening bar click when the playing event arrives a few milliseconds late", (t) => {
  const f = fixture(t);
  f.media.currentTime = 0.008;
  f.emit("playing");
  f.tick();
  assert.equal(f.voices.length, 1);
  assert.equal(f.voices[0].frequency.value, 1600);
});

test("accents the new bar pattern after a time signature change", (t) => {
  const f = fixture(
    t,
    tempoGridLines(5000, 120, 0, 8, [
      { id: "three", time: 2000, numerator: 3, denominator: 4 },
    ])
  );
  f.media.currentTime = 1.95;
  f.emit("seeked");
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 1600);
  f.media.currentTime = 2.2;
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 800);
  f.media.currentTime = 3.45;
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 1600);
});

test("tempo changes update click spacing without accenting an interior beat", (t) => {
  const f = fixture(
    t,
    tempoGridLines(4000, 120, 0, 4, [], [{ id: "slower", time: 500, bpm: 60 }])
  );
  f.media.currentTime = 0.45;
  f.emit("seeked");
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 800);
  const count = f.voices.length;
  f.media.currentTime = 0.95;
  f.tick();
  assert.equal(f.voices.length, count);
  f.media.currentTime = 1.45;
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 800);
  f.media.currentTime = 3.45;
  f.tick();
  assert.equal(f.voices.at(-1).frequency.value, 1600);
});
