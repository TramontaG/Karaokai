import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const compile = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const domain = compile(
  readFileSync(new URL("../src/domain/project.ts", import.meta.url), "utf8")
);
const source = readFileSync(
  new URL("../src/util/karaoke/book.ts", import.meta.url),
  "utf8"
).replace('"../../domain/project"', JSON.stringify(domain));
const { layoutBook, bookViewAt } = await import(compile(source));
const { wordReadProgress } = await import(domain);
const measure = (text, font) => {
  const size = Number(font.match(/([\d.]+)px/)[1]);
  return {
    width: text.length * size * 0.55,
    ascent: size * 0.9,
    descent: size * 0.25,
    bearing: 0,
  };
};
const phrase = (id, start, end, text = id) => ({
  id,
  start,
  end,
  text,
  words: [{ id: `${id}-word`, text, start, end }],
});
const track = (phrases, style = {}) => ({
  id: "track",
  type: "subtitle",
  visible: true,
  style,
  phrases,
});
const freeze = (object) => {
  if (!object || typeof object !== "object") return;
  Object.values(object).forEach(freeze);
  Object.freeze(object);
};

function assertFits(layout, time) {
  const view = bookViewAt(layout, time);
  assert.equal(new Set(view.map((row) => row.slot)).size, view.length);
  for (const row of view)
    for (const word of row.words) {
      assert.ok(word.x >= -1e-7);
      assert.ok(
        word.x + word.width <= layout.width + 1e-7,
        `${word.word.text}: right edge`
      );
      assert.ok(word.y - word.ascent >= -1e-7);
      assert.ok(
        word.y + word.descent <= layout.height + 1e-7,
        `${word.word.text}: bottom edge`
      );
    }
}

test("rows fill from the top, replace completed phrases in place, and cycle after the last row", () => {
  const input = track(
    Array.from({ length: 30 }, (_, i) =>
      phrase(`p${i}`, i * 500, (i + 1) * 500)
    )
  );
  const original = JSON.stringify(input);
  freeze(input);
  const layout = layoutBook(input, measure);
  const capacity = layout.entries.findIndex(
    (entry, i) => i > 0 && entry.top === layout.area.y
  );
  assert.ok(capacity > 1 && capacity < input.phrases.length);
  const initial = bookViewAt(layout, 0);
  assert.equal(initial.length, capacity);
  assert.deepEqual(
    initial.map((row) => row.phrase.id),
    input.phrases.slice(0, capacity).map((p) => p.id)
  );
  const replaced = bookViewAt(layout, 850);
  assert.equal(replaced[0].phrase.id, `p${capacity}`);
  assert.equal(replaced[1].phrase.id, "p1");
  assert.equal(replaced[1].active, true);
  const wrapped = bookViewAt(layout, capacity * 500);
  assert.equal(wrapped[0].phrase.id, `p${capacity}`);
  assert.equal(wrapped[0].active, true);
  for (let time = 0; time < 16000; time += 125) assertFits(layout, time);
  assert.equal(bookViewAt(layout, 15350).length, 0);
  assert.equal(JSON.stringify(input), original);
});

test("phrases beyond ten seconds are withheld and resume at the top after an empty long pause", () => {
  const input = track([
    phrase("A", 0, 1000),
    phrase("B", 1000, 2000),
    phrase("C", 12000.125, 13000),
    phrase("D", 13000, 14000),
  ]);
  const layout = layoutBook(input, measure);
  assert.equal(bookViewAt(layout, 2350).length, 0);
  assert.equal(bookViewAt(layout, 9000.124).length, 0);
  const upcoming = bookViewAt(layout, 9000.125);
  assert.equal(upcoming.length, 2);
  assert.equal(upcoming[0].phrase.id, "C");
  assert.equal(upcoming[0].slot, 0);
  assert.equal(upcoming[0].active, false);
  assert.equal(bookViewAt(layout, 12000.125)[0].active, true);
  const exact = layoutBook(
    track([phrase("A", 0, 1000), phrase("B", 11000, 12000)]),
    measure
  );
  assert.equal(exact.entries[1].sectionIndex, 0);
  assert.equal(bookViewAt(exact, 1350)[0].phrase.id, "B");
});

test("a replacement waits until it is within ten seconds while other rows keep their places", () => {
  const input = track(
    Array.from({ length: 25 }, (_, i) =>
      phrase(`p${i}`, i * 2500, i * 2500 + 1000)
    )
  );
  const layout = layoutBook(input, measure);
  const capacity = layout.entries.findIndex(
    (entry, i) => i > 0 && entry.top === layout.area.y
  );
  const replacement = layout.entries[capacity];
  assert.ok(replacement.start - 1000 > 10000);
  assert.ok(bookViewAt(layout, 1350).every((row) => row.slot !== 0));
  assert.ok(
    bookViewAt(layout, replacement.start - 10000 - 0.001).every(
      (row) => row.slot !== 0
    )
  );
  assert.equal(
    bookViewAt(layout, replacement.start - 10000)[0].phrase.id,
    replacement.phrase.id
  );
});

test("font, scale, wrapping, long words and offsets determine capacity without overflowing the frame", () => {
  for (const [width, height] of [
    [640, 360],
    [360, 640],
    [1920, 1080],
    [200, 100],
  ]) {
    const small = layoutBook(
      track([phrase("A", 0, 1000)], {
        positionReferenceWidth: width,
        positionReferenceHeight: height,
      }),
      measure
    );
    const large = layoutBook(
      track([phrase("A", 0, 1000)], {
        positionReferenceWidth: width,
        positionReferenceHeight: height,
        scale: 4,
      }),
      measure
    );
    assert.ok(large.entries[0].height >= small.entries[0].height);
    const p = phrase("huge", 0, 1000);
    p.style = { x: 5000, y: 3000 };
    p.words = Array.from({ length: 100 }, (_, index) => ({
      id: `${index}`,
      text: "Longword".repeat((index % 4) + 1),
      start: index * 10,
      end: index * 10 + 10,
      style: {
        scale: (index % 3) + 1,
        x: index % 2 ? -9000 : 9000,
        y: index % 2 ? 4000 : -4000,
        fontStyle: "italic",
        verticalAlign: index % 2 ? "super" : "sub",
      },
    }));
    const layout = layoutBook(
      track([p], {
        positionReferenceWidth: width,
        positionReferenceHeight: height,
        scale: 4,
        x: 9999,
        y: 9999,
      }),
      measure
    );
    assertFits(layout, 500);
    assert.equal(layout.entries[0].top, layout.area.y);
    assert.equal(bookViewAt(layout, 500)[0].words.length, 100);
  }
});

test("word fill uses Continuity curves and colors, preserving exact fractional timestamps", () => {
  const p = phrase("A", 1000.125, 2200.875);
  p.curve = "ease-in";
  p.style = { readColor: "#123456" };
  p.words[0].style = { unreadColor: "#abcdef" };
  const input = track([p]);
  const layout = layoutBook(input, measure);
  for (const time of [0, 1000.125, 1300.3, 1800, 2200.874]) {
    const word = bookViewAt(layout, time)[0].words[0];
    assert.equal(word.progress, wordReadProgress(p.words[0], time, "ease-in"));
    assert.equal(word.style.readColor, "#123456");
    assert.equal(word.style.unreadColor, "#abcdef");
  }
  assert.equal(bookViewAt(layout, 2550.875).length, 0);
});

test("seeking is deterministic, gaps have no labels, and empty/overlapping tracks stay bounded", () => {
  assert.equal(bookViewAt(layoutBook(track([]), measure), 10).length, 0);
  const p = phrase("A", 1000, 3000);
  p.words.push({ id: "gap", text: "", type: "gap", start: 3000, end: 3500 });
  const layout = layoutBook(track([p, phrase("B", 3500, 4500)]), measure);
  const first = bookViewAt(layout, 1750);
  bookViewAt(layout, 50000);
  assert.deepEqual(bookViewAt(layout, 1750), first);
  assert.equal(
    bookViewAt(layout, 3200).find((row) => row.phrase.id === "A").words.length,
    1
  );
  const overlapping = layoutBook(
    track(
      Array.from({ length: 20 }, (_, i) => phrase(`p${i}`, i * 10, 5000)),
      { scale: 4 }
    ),
    measure
  );
  for (const time of [0, 10, 50, 200, 4000]) assertFits(overlapping, time);
});

test("mixed phrase heights keep their initial coordinates through replacements", () => {
  const phrases = Array.from({ length: 24 }, (_, i) => {
    const p = phrase(`p${i}`, i * 500, (i + 1) * 500);
    p.words = Array.from({ length: i % 3 === 1 ? 8 : 2 }, (_, j) => ({
      id: `${i}-${j}`,
      text: "reading",
      start: p.start,
      end: p.end,
    }));
    return p;
  });
  const layout = layoutBook(track(phrases, { scale: 2 }), measure);
  assert.ok(new Set(layout.entries.map((p) => p.height)).size > 1);
  const positions = new Map();
  for (let time = 0; time < 12000; time += 125) {
    const rows = bookViewAt(layout, time);
    assertFits(layout, time);
    for (const row of rows) {
      const coordinates = row.words.map((word) => [word.x, word.y]);
      if (positions.has(row.id))
        assert.deepEqual(coordinates, positions.get(row.id));
      positions.set(row.id, coordinates);
    }
    for (let i = 1; i < rows.length; i++) {
      assert.ok(
        rows[i].top >=
          rows[i - 1].top + rows[i - 1].height + layout.spacing - 1e-7
      );
    }
  }
  const initial = bookViewAt(layout, 0);
  for (let i = 1; i < initial.length; i++) {
    assert.ok(
      Math.abs(
        initial[i].top -
          initial[i - 1].top -
          initial[i - 1].height -
          layout.spacing
      ) < 1e-7
    );
  }
});

test("entry cue anticipates by two seconds, fills at entry, and disappears after the first word", () => {
  const p = phrase("A", 5000.125, 8000);
  p.words[0].end = 6000;
  p.words.push({ id: "second", text: "second", start: 6000, end: 8000 });
  const layout = layoutBook(
    track([p], { unreadColor: "#ffffff", readColor: "#ff0000" }),
    measure
  );
  const row = (time) => bookViewAt(layout, time)[0];
  assert.equal(row(3000).cue, null);
  assert.equal(row(3000.125).cue.progress, 0);
  assert.equal(row(4000.125).cue.progress, 0.5);
  assert.equal(row(5000.125).cue.progress, 1);
  assert.equal(row(5999).cue.progress, 1);
  assert.equal(row(6000).cue, null);
  const cue = row(4000.125).cue;
  assert.equal(cue.unreadColor, "#ffffff");
  assert.equal(cue.readColor, "#ff0000");
  assert.ok(cue.y >= 0 && cue.y + cue.height < row(4000.125).top);
  assert.ok(cue.x >= 0 && cue.x + cue.width <= layout.width);
  assert.deepEqual(row(4000.125).cue, cue);
});

test("a taller replacement waits for both occupied rows without moving the remaining phrase", () => {
  const wrapped = (id, start, end) => {
    const p = phrase(id, start, end);
    p.words = Array.from({ length: 4 }, (_, i) => ({
      id: `${id}-${i}`,
      text: "reading",
      start,
      end,
    }));
    return p;
  };
  const make = (overlap) =>
    layoutBook(
      track(
        [
          phrase("A", 0, 1000),
          wrapped("B", 1000, overlap ? 5000 : 2000),
          phrase("C", overlap ? 1200 : 2000, 5000),
          wrapped("D", overlap ? 1500 : 3000, 6000),
        ],
        { scale: 2, positionReferenceWidth: 640, positionReferenceHeight: 250 }
      ),
      measure
    );
  for (const overlap of [false, true]) {
    const layout = make(overlap);
    const [a, b, c, d] = layout.entries;
    assert.equal(d.top, a.top);
    assert.ok(d.top + d.height > b.top);
    assert.equal(d.showAt, overlap ? 1500 : 2350);
    const before = bookViewAt(layout, d.showAt - 0.001);
    assert.ok(before.some((row) => row.phrase.id === "B"));
    assert.ok(!before.some((row) => row.phrase.id === "D"));
    const after = bookViewAt(layout, d.showAt);
    assert.ok(after.some((row) => row.phrase.id === "D"));
    assert.ok(!after.some((row) => row.phrase.id === "B"));
    assert.equal(after.find((row) => row.phrase.id === "C").top, c.top);
    assertFits(layout, d.showAt);
    assert.deepEqual(bookViewAt(layout, 0), bookViewAt(make(overlap), 0));
  }
});

test("the first page fades in together three seconds before singing after a long silence", () => {
  const layout = layoutBook(
    track([
      phrase("old", 0, 1000),
      phrase("A", 20000.125, 21000),
      phrase("B", 22000, 23000),
      phrase("C", 25000, 26000),
    ]),
    measure
  );
  for (const time of [1350, 5000, 15000, 17000.124]) {
    assert.deepEqual(bookViewAt(layout, time), []);
  }
  const opening = bookViewAt(layout, 17000.125);
  assert.deepEqual(
    opening.map((row) => row.phrase.id),
    ["A", "B", "C"]
  );
  assert.ok(opening.every((row) => row.opacity === 0));
  const midway = bookViewAt(layout, 17175.125);
  assert.ok(midway.every((row) => row.opacity === 0.5));
  const visible = bookViewAt(layout, 17350.125);
  assert.ok(visible.every((row) => row.opacity === 1));
  assert.equal(visible[0].top, layout.area.y);
  assert.ok(visible.every((row) => row.cue === null));
  assert.ok(bookViewAt(layout, 19000.125)[0].cue);
  const fading = bookViewAt(layout, 21175).find((row) => row.phrase.id === "A");
  assert.equal(fading.opacity, 0.5);
  assert.equal(fading.words[0].progress, 1);
  assert.ok(!bookViewAt(layout, 21350).some((row) => row.phrase.id === "A"));
  bookViewAt(layout, 50000);
  assert.deepEqual(bookViewAt(layout, 17175.125), midway);
});

test("cue is suppressed during continuous singing and brief gaps, including overlapping phrases", () => {
  for (const gap of [0, 1000, 3999.999, 4000]) {
    const start = 2000 + gap;
    const layout = layoutBook(
      track([phrase("A", 0, 2000), phrase("B", start, start + 1000)]),
      measure
    );
    for (const time of [start - 1000, start, start + 500]) {
      const next = bookViewAt(layout, time).find(
        (row) => row.phrase.id === "B"
      );
      assert.equal(next.cue !== null, gap >= 4000);
    }
  }
  const overlap = layoutBook(
    track([
      phrase("long", 0, 10000),
      phrase("short", 1000, 2000),
      phrase("next", 7000, 8000),
    ]),
    measure
  );
  assert.equal(
    bookViewAt(overlap, 6000).find((row) => row.phrase.id === "next").cue,
    null
  );
});
