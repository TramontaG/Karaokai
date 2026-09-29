import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
const read = (name) =>
  readFileSync(new URL(`../src/${name}.ts`, import.meta.url), "utf8");
const compile = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const domain = compile(read("domain/project"));
const book = compile(
  read("util/karaoke/book").replace(
    '"../../domain/project"',
    JSON.stringify(domain)
  )
);
const { layoutTeleprompter, teleprompterViewAt } = await import(
  compile(
    read("util/karaoke/teleprompter").replace('"./book"', JSON.stringify(book))
  )
);
const measure = (text, font) => ({
  width: text.length * Number(font.match(/([\d.]+)px/)[1]) * 0.5,
});
const phrase = (id, start, end) => ({
  id,
  text: id,
  start,
  end,
  words: [{ id, text: id, start, end }],
});
const track = (style = {}) => ({
  id: "track",
  type: "subtitle",
  style,
  phrases: [
    phrase("A", 3000, 5000),
    phrase("B", 6000, 8000),
    phrase("C", 20000, 22000),
  ],
});

test("scroll follows song time, continues through short gaps and lands on the anchor at each entry", () => {
  const input = track();
  const original = JSON.stringify(input);
  const layout = layoutTeleprompter(input, measure);
  const at = (time) => teleprompterViewAt(layout, time);
  const y = (time) => at(time).find((p) => p.phrase.id === "A").top;
  assert.ok(y(3000) > y(4000));
  assert.ok(y(4000) > y(5000));
  assert.ok(y(5000) > y(5500));
  assert.ok(y(5500) > y(5999.999));
  // Shared velocity across a phrase start: no stop and no abrupt speed change.
  const leftSpeed = (y(5999.9) - y(6000)) / 0.1;
  const rightSpeed = (y(6000) - y(6000.1)) / 0.1;
  assert.ok(leftSpeed > 0.001);
  assert.ok(rightSpeed > 0.001);
  assert.ok(Math.abs(leftSpeed - rightSpeed) < leftSpeed * 0.001);
  assert.equal(at(5500)[0].words[0].progress, 1);
  assert.ok(
    Math.abs(at(5999.999).find((p) => p.phrase.id === "B").top - 180) < 0.001
  );
  assert.equal(at(3000).find((p) => p.phrase.id === "A").top, 180);
  assert.equal(at(6000).find((p) => p.phrase.id === "B").top, 180);
  assert.equal(at(4000)[0].words[0].progress, 0.5);
  assert.ok(at(4000).every((p) => p.opacity === 1));
  const expected = at(4000);
  at(21000);
  assert.deepEqual(at(4000), expected);
  assert.deepEqual(at(12000), []);
  assert.deepEqual(at(23000), []);
  assert.equal(JSON.stringify(input), original);
});

test("X/Y move the anchor without rewrapping or changing timing, at any reference resolution", () => {
  for (const [width, height] of [
    [640, 360],
    [1920, 1080],
    [360, 640],
  ]) {
    const style = {
      positionReferenceWidth: width,
      positionReferenceHeight: height,
    };
    const normal = teleprompterViewAt(
      layoutTeleprompter(track(style), measure),
      4000
    );
    const shifted = teleprompterViewAt(
      layoutTeleprompter(track({ ...style, x: -20, y: 25 }), measure),
      4000
    );
    for (const row of normal) {
      const moved = shifted.find((p) => p.id === row.id);
      assert.equal(moved.words.length, row.words.length);
      assert.ok(Math.abs(moved.words[0].x - row.words[0].x + 20) < 1e-7);
      assert.ok(Math.abs(moved.top - row.top - 25) < 1e-7);
      assert.equal(moved.words[0].progress, row.words[0].progress);
    }
  }
});

test("empty and nonfinite views are safe and long pauses enter by scrolling instead of fading", () => {
  assert.deepEqual(
    teleprompterViewAt(
      layoutTeleprompter({ ...track(), phrases: [] }, measure),
      0
    ),
    []
  );
  const layout = layoutTeleprompter(track(), measure);
  assert.deepEqual(teleprompterViewAt(layout, NaN), []);
  assert.deepEqual(teleprompterViewAt(layout, 16999), []);
  const entering = teleprompterViewAt(layout, 18500)[0];
  assert.equal(entering.phrase.id, "C");
  assert.ok(entering.top > 180);
  assert.equal(entering.opacity, 1);
});

test("unequal phrase durations and heights retain forward, continuous boundary velocity", () => {
  const input = track();
  input.phrases = [
    phrase("A", 1000, 1800),
    phrase("B", 2200, 8000),
    phrase("C", 8500, 9000),
    phrase("D", 9200, 10000),
  ];
  input.phrases[1].style = { scale: 2 };
  const layout = layoutTeleprompter(input, measure);
  for (const time of [2200, 8500, 9200]) {
    const id = input.phrases.find((p) => p.start === time).id;
    const y = (t) =>
      teleprompterViewAt(layout, t).find((p) => p.phrase.id === id).top;
    const left = (y(time - 0.01) - y(time)) / 0.01;
    const right = (y(time) - y(time + 0.01)) / 0.01;
    assert.ok(left > 0 && right > 0);
    assert.ok(Math.abs(left - right) < left * 0.001);
    assert.ok(Math.abs(y(time) - layout.area.y) < 1e-7);
  }
  for (let i = 0; i < 3; i++) {
    const current = input.phrases[i],
      next = input.phrases[i + 1];
    let previous = Infinity;
    for (let step = 0; step <= 100; step++) {
      const time = current.start + ((next.start - current.start) * step) / 100;
      const top = teleprompterViewAt(layout, time).find(
        (p) => p.phrase.id === next.id
      ).top;
      assert.ok(top < previous);
      assert.ok(top >= layout.area.y - 1e-7);
      previous = top;
    }
  }
});
