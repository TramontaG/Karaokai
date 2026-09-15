import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/util/editor/timelineFollow.ts", import.meta.url),
    "utf8"
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }
);
const { createTimelineFollowScroll, timelineRangeContainsViewport } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
function fixture(quantized = false) {
  let position = 0,
    id = 0;
  const callbacks = new Map();
  const positions = [];
  const scroll = createTimelineFollowScroll({
    read: () => position,
    write: (next) => {
      position = quantized ? Math.round(next) : next;
      positions.push(next);
    },
    requestFrame: (cb) => {
      callbacks.set(++id, cb);
      return id;
    },
    cancelFrame: (id) => callbacks.delete(id),
  });
  return {
    scroll,
    positions,
    get position() {
      return position;
    },
    get pending() {
      return callbacks.size;
    },
    step(now) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((cb) => cb(now));
    },
  };
}
test("activation approaches the cursor smoothly, lands exactly and stops scheduling", () => {
  const f = fixture();
  f.scroll.follow(800);
  assert.equal(f.position, 0);
  f.step(0);
  assert.ok(f.position > 0 && f.position < 200);
  for (let now = 16; now < 1500; now += 16) f.step(now);
  assert.equal(f.position, 800);
  assert.equal(f.pending, 0);
  assert.ok(f.positions.every((x, i) => i === 0 || x >= f.positions[i - 1]));
});
test("continuous playback retargets one animation and advances every frame", () => {
  const f = fixture();
  for (let frame = 0; frame < 120; frame++) {
    const previous = f.position;
    f.scroll.follow(200 + frame * 3);
    f.scroll.follow(200 + frame * 3);
    assert.equal(f.pending, 1);
    f.step((frame * 1000) / 60);
    assert.ok(f.position > previous);
  }
  assert.ok(f.position > 500);
});
test("easing converges equally at 60 and 120 Hz", () => {
  const at = (hz) => {
    const f = fixture();
    f.scroll.follow(1000);
    f.step(0);
    for (let i = 1; i <= hz / 2; i++) f.step((i * 1000) / hz);
    return f.position;
  };
  assert.ok(Math.abs(at(60) - at(120)) < 0.001);
});
test("turning follow off or zooming cancels queued motion; a backward seek can start again", () => {
  const f = fixture();
  f.scroll.follow(1000);
  f.step(0);
  f.scroll.cancel();
  const stopped = f.position;
  f.step(100);
  assert.equal(f.position, stopped);
  assert.equal(f.pending, 0);
  f.scroll.follow(0);
  for (let now = 200; now < 1500; now += 16) f.step(now);
  assert.equal(f.position, 0);
});
test("virtualized project edges stay covered during small follow scrolls", () => {
  assert.equal(
    timelineRangeContainsViewport({ start: 0, end: 3000 }, 100, 1100, 10000),
    true
  );
  assert.equal(
    timelineRangeContainsViewport(
      { start: 7000, end: 10000 },
      8900,
      9900,
      10000
    ),
    true
  );
  assert.equal(
    timelineRangeContainsViewport({ start: 0, end: 3000 }, 2200, 3200, 10000),
    false
  );
  assert.equal(
    timelineRangeContainsViewport(
      { start: 2000, end: 5000 },
      1900,
      2900,
      10000
    ),
    false
  );
  assert.equal(
    timelineRangeContainsViewport({ start: 0, end: 0 }, 0, 1000, 10000),
    false
  );
});

test("rounded browser scroll positions still converge and stop requesting frames", () => {
  const f = fixture(true);
  f.scroll.follow(800.25);
  for (let now = 0; now < 1500; now += 16) f.step(now);
  assert.equal(f.position, 800);
  assert.equal(f.pending, 0);
});
