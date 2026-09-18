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
  new URL("../src/util/karaoke/banner.ts", import.meta.url),
  "utf8"
).replace('"../../domain/project"', JSON.stringify(domain));
const {
  layoutBanner,
  bannerWordState,
  bannerPlayheadOpacity,
  bannerPlayheadsAt,
} = await import(compile(source));
const word = (id, start, end, text = id, style) => ({
  id,
  start,
  end,
  text,
  style,
});
const track = (words, style = {}, phraseStyle) => ({
  id: "track",
  style,
  phrases: [{ id: "phrase", start: 0, end: 9999, words, style: phraseStyle }],
});
const measure = (text) => text.length * 10;

test("edges cross playhead at exact source milliseconds across speeds and positions", () => {
  for (const speed of [1, 57.5, 100, 1000]) {
    const input = track(
      [word("a", 1234.567, 1999.999)],
      { bannerSpeed: speed, x: 25 },
      { x: -7 }
    );
    const before = JSON.stringify(input);
    const layout = layoutBanner(input, measure);
    const item = layout.words[0];
    assert.ok(
      Math.abs(item.left - (item.word.start / 1000) * speed - item.anchor) <
        1e-9
    );
    assert.ok(
      Math.abs(item.right - (item.word.end / 1000) * speed - item.anchor) < 1e-9
    );
    assert.equal(item.anchor, 338);
    assert.equal(JSON.stringify(input), before);
  }
});
test("half-open state intervals have no early reads and handle zero duration", () => {
  assert.equal(bannerWordState(10, 20, 9.999), "unread");
  assert.equal(bannerWordState(10, 20, 10), "current");
  assert.equal(bannerWordState(10, 20, 19.999), "current");
  assert.equal(bannerWordState(10, 20, 20), "read");
  assert.equal(bannerWordState(10, 10, 10), "read");
});
test("overflow alone stays centered; crowded adjacent phrases lift labels without moving rectangles", () => {
  const single = layoutBanner(
    track([word("a", 0, 10, "long word")], {
      bannerLongWordAlignment: "center",
    }),
    measure
  ).words[0];
  assert.equal(single.lifted, false);
  assert.equal(single.labelX, single.center);
  const input = track([
    word("a", 0, 10, "very long word"),
    word("gap", 10, 15),
  ]);
  input.phrases[0].words[1].type = "gap";
  input.phrases.push({
    id: "second",
    words: [word("b", 20, 30, "another long word"), word("c", 40, 50, "third")],
  });
  const layout = layoutBanner(input, measure);
  assert.equal(layout.words.length, 3);
  for (let i = 0; i < layout.words.length; i++) {
    const item = layout.words[i];
    assert.equal(item.lifted, true);
    assert.ok(item.labelY < item.y - item.boxHeight / 2);
    assert.equal(
      item.left,
      item.anchor + (item.word.start * layout.speed) / 1000
    );
    if (i) {
      const previous = layout.words[i - 1];
      assert.ok(
        previous.labelX + previous.textWidth / 2 <
          item.labelX - item.textWidth / 2
      );
    }
  }
  assert.deepEqual(layoutBanner(input, measure), layout);
});
test("styles inherit by scope and speed belongs to track", () => {
  const item = layoutBanner(
    track(
      [
        word("a", 0, 1000, "a", {
          currentColor: "#333333",
          bannerSpeed: 999,
          y: 3,
        }),
      ],
      {
        currentColor: "#111111",
        playheadColor: "#123456",
        bannerSpeed: 80,
        y: 10,
      },
      { currentColor: "#222222", unreadRectangleColor: "#abcdef", y: 2 }
    ),
    measure
  ).words[0];
  assert.equal(item.style.currentColor, "#333333");
  assert.equal(item.style.playheadColor, "#123456");
  assert.equal(item.style.unreadRectangleColor, "#abcdef");
  assert.equal(item.right - item.left, 80);
  assert.equal(item.y, 195);
});

test("interleaved Y lanes do not hide collisions between neighboring labels", () => {
  const { words } = layoutBanner(
    track([
      word("a", 0, 10, "wide label", { y: 0 }),
      word("b", 20, 30, "other lane", { y: 120 }),
      word("c", 40, 50, "wide label", { y: 0 }),
    ]),
    measure
  );
  const [a, b, c] = words;
  assert.equal(a.lifted, true);
  assert.equal(c.lifted, true);
  assert.equal(b.lifted, false);
  assert.ok(a.labelX + a.textWidth / 2 < c.labelX - c.textWidth / 2);
});

test("font resizing inherits by scope without changing timed rectangles or phrase clipping", () => {
  const input = track([
    word("first", 0, 300, "First"),
    word("middle", 300, 600, "Middle"),
    word("last", 600, 1000, "Last"),
  ]);
  const before = layoutBanner(input, measure);
  input.style.bannerFontSize = 18;
  input.phrases[0].style = { bannerFontSize: 22 };
  input.phrases[0].words[1].style = { bannerFontSize: 30 };
  const after = layoutBanner(input, measure);
  assert.equal(after.words[0].fontSize, 22);
  assert.equal(after.words[1].fontSize, 30);
  assert.equal(after.words[2].fontSize, 22);
  assert.deepEqual(after.groups, before.groups);
  assert.equal(after.groups.length, 1);
  assert.equal(after.groups[0].left, after.words[0].left);
  assert.equal(after.groups[0].right, after.words[2].right);
  for (let i = 0; i < after.words.length; i++) {
    assert.equal(after.words[i].left, before.words[i].left);
    assert.equal(after.words[i].right, before.words[i].right);
    assert.equal(after.words[i].boxHeight, before.words[i].boxHeight);
  }
});

test("pauses retain exact intervals, extend the phrase outline, and never displace labels", () => {
  const text = word("text", 500, 1500, "Singing");
  const input = track([
    { ...word("before", 0, 500, "ignored"), type: "gap" },
    text,
    {
      ...word("after", 1500, 2200, "ignored"),
      type: "gap",
      style: { currentRectangleColor: "#123456" },
    },
  ]);
  const measured = [];
  const layout = layoutBanner(input, (text) => {
    measured.push(text);
    return measure(text);
  });
  assert.deepEqual(measured, ["Singing"]);
  assert.equal(layout.words.length, 1);
  assert.equal(layout.words[0].lifted, false);
  assert.equal(layout.segments.length, 3);
  const [before, , after] = layout.segments;
  assert.equal(before.right - before.left, 0.5 * layout.speed);
  assert.equal(after.right - after.left, 0.7 * layout.speed);
  assert.equal(before.right, layout.words[0].left);
  assert.equal(after.left, layout.words[0].right);
  assert.equal(layout.groups[0].left, before.left);
  assert.equal(layout.groups[0].right, after.right);
  assert.equal(after.style.currentRectangleColor, "#123456");
  assert.equal(
    bannerWordState(after.word.start, after.word.end, 1500),
    "current"
  );
  assert.equal(bannerWordState(after.word.start, after.word.end, 2200), "read");
  const onlyGap = layoutBanner(track([input.phrases[0].words[0]]), measure);
  assert.equal(onlyGap.segments.length, 1);
  assert.equal(onlyGap.words.length, 0);
  assert.equal(onlyGap.groups.length, 1);
});

test("left-aligned long labels follow the actual rectangle edge without changing its timing", () => {
  for (const [end, text] of [
    [10, "A very long word"],
    [10000, "Held"],
  ]) {
    const input = track([word("a", 0, end, text)], {
      bannerLongWordAlignment: "left",
    });
    const left = layoutBanner(input, measure).words[0];
    assert.equal(left.labelX - measure(text) / 2 - left.left, 10);
    input.style.bannerLongWordAlignment = "center";
    const center = layoutBanner(input, measure).words[0];
    assert.equal(center.labelX, center.center);
    assert.equal(left.left, center.left);
    assert.equal(left.right, center.right);
  }
  const short = layoutBanner(track([word("a", 0, 500, "Hi")]), measure)
    .words[0];
  assert.equal(short.labelX, short.center);
});

test("rectangle opacity and long-word alignment inherit through all scopes, including zero opacity", () => {
  const input = track([word("a", 0, 10, "Long")], {
    bannerRectangleOpacity: 0.5,
    bannerLongWordAlignment: "center",
  });
  assert.equal(
    layoutBanner(input, measure).words[0].style.bannerRectangleOpacity,
    0.5
  );
  input.phrases[0].style = {
    bannerRectangleOpacity: 0.25,
    bannerLongWordAlignment: "left",
  };
  assert.equal(
    layoutBanner(input, measure).words[0].style.bannerRectangleOpacity,
    0.25
  );
  input.phrases[0].words[0].style = {
    bannerRectangleOpacity: 0,
    bannerLongWordAlignment: "center",
  };
  const result = layoutBanner(input, measure).words[0];
  assert.equal(result.style.bannerRectangleOpacity, 0);
  assert.equal(result.labelX, result.center);
  assert.equal(result.style.unreadColor, "#FFFFFF");
});

const timedPhrase = (id, start, end, style) => ({
  id,
  text: id,
  start,
  end,
  style,
  words: [word(`${id}-word`, start, end, id)],
});

test("short inter-phrase pauses join outlines without changing project data or word times", () => {
  const input = track([]);
  input.phrases = [
    timedPhrase("A", 19000, 20150, { unreadRectangleColor: "#123456" }),
    timedPhrase("B", 20750, 22000, { unreadRectangleColor: "#abcdef" }),
  ];
  input.phrases[0].words[0].style = { bannerRectangleOpacity: 0.4 };
  const original = JSON.stringify(input);
  const freeze = (value) => {
    if (!value || typeof value !== "object") return;
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  };
  freeze(input);
  const layout = layoutBanner(input, measure);
  assert.equal(layout.groups.length, 1);
  const [a, silence, b] = layout.segments;
  assert.equal(silence.synthetic, true);
  assert.equal(silence.isGap, true);
  assert.equal(silence.word.start, 20150);
  assert.equal(silence.word.end, 20750);
  assert.equal(silence.left, a.right);
  assert.equal(silence.right, b.left);
  assert.equal(silence.right - silence.left, 180);
  assert.equal(silence.style.unreadRectangleColor, "#123456");
  assert.equal(silence.style.bannerRectangleOpacity, 0.4);
  assert.equal(b.style.unreadRectangleColor, "#abcdef");
  assert.equal(a.groupIndex, b.groupIndex);
  assert.notEqual(a.phraseIndex, b.phraseIndex);
  assert.equal(layout.groups[0].left, a.left);
  assert.equal(layout.groups[0].right, b.right);
  assert.equal(layout.words.length, 2);
  assert.equal(a.word, input.phrases[0].words[0]);
  assert.equal(b.word, input.phrases[1].words[0]);
  assert.equal(JSON.stringify(input), original);
  assert.deepEqual(layoutBanner(input, measure), layout);
});

test("touching phrases and gaps up to exactly two seconds join; larger gaps and overlaps stay separate", () => {
  for (const gap of [-100, 0, 0.125, 600, 2000, 2000.001, 3000]) {
    const input = track([]);
    input.phrases = [
      timedPhrase("A", 19000, 20150),
      timedPhrase("B", 20150 + gap, 24150 + gap),
    ];
    const result = layoutBanner(input, measure);
    const join = gap >= 0 && gap <= 2000;
    assert.equal(result.groups.length, join ? 1 : 2, `gap=${gap}`);
    const silences = result.segments.filter((segment) => segment.synthetic);
    assert.equal(silences.length, join && gap > 0 ? 1 : 0, `gap=${gap}`);
    if (silences.length) {
      assert.equal(silences[0].word.end - silences[0].word.start, gap);
      assert.ok(
        Math.abs(
          silences[0].right - silences[0].left - (gap / 1000) * result.speed
        ) < 1e-8
      );
    }
  }
});

test("chronological chains share a single outline and retain existing pauses without duplicating them", () => {
  const a = timedPhrase("A", 0, 1000);
  a.words.push({
    id: "explicit",
    type: "gap",
    text: "",
    start: 1000,
    end: 1500,
  });
  a.end = 1500;
  const b = timedPhrase("B", 1500, 2000);
  const c = timedPhrase("C", 2600, 3200);
  const d = timedPhrase("D", 5500, 6000);
  const input = track([]);
  input.phrases = [d, c, a, b];
  const result = layoutBanner(input, measure);
  assert.equal(result.groups.length, 2);
  assert.equal(
    result.segments.filter((segment) => segment.synthetic).length,
    1
  );
  assert.equal(
    result.segments.filter((segment) => segment.word.id === "explicit").length,
    1
  );
  assert.equal(result.words[0].groupIndex, result.words[2].groupIndex);
  assert.notEqual(result.words[2].groupIndex, result.words[3].groupIndex);
  assert.deepEqual(
    input.phrases.map((phrase) => phrase.id),
    ["D", "C", "A", "B"]
  );
});

test("playhead fades before entry and after exit using song time, including seeks", () => {
  for (const [time, opacity] of [
    [0, 0],
    [500, 0.5],
    [1000, 1],
    [1500, 1],
    [2000, 1],
    [2500, 0.5],
    [3000, 0],
    [9999, 0],
  ]) {
    assert.equal(bannerPlayheadOpacity(1000, 2000, time), opacity);
  }
  const input = track([word("a", 1000, 2000)]);
  const layout = layoutBanner(input, measure);
  const at = (time) => [...bannerPlayheadsAt(layout, time).values()];
  assert.equal(at(0).length, 0);
  assert.equal(at(9999).length, 0);
  assert.equal(at(500)[0].opacity, 0.5);
  assert.equal(at(1500)[0].opacity, 1);
  assert.equal(at(2500)[0].opacity, 0.5);
  assert.equal(at(500)[0].opacity, 0.5);
  assert.equal(
    bannerPlayheadsAt(layoutBanner(track([]), measure), 1000).size,
    0
  );
  assert.equal(bannerPlayheadOpacity(1000, 1000, 1000), 0);
});

test("playhead stays steady through joined silences and disappears in long pauses", () => {
  const input = track([]);
  input.phrases = [
    timedPhrase("A", 1000, 2000),
    timedPhrase("B", 2600, 3000),
    timedPhrase("C", 7000, 8000),
  ];
  const layout = layoutBanner(input, measure);
  const at = (time) => [...bannerPlayheadsAt(layout, time).values()];
  for (const time of [1000, 1999, 2000, 2300, 2599, 2600, 3000])
    assert.equal(at(time)[0].opacity, 1);
  assert.equal(at(3500)[0].opacity, 0.5);
  assert.equal(at(4000).length, 0);
  assert.equal(at(6000).length, 0);
  assert.equal(at(6500)[0].opacity, 0.5);
  assert.equal(at(7000)[0].opacity, 1);
});

test("playhead fade is independent of zoom, rectangle opacity and another positioned lane", () => {
  const input = track(
    [word("first", 1000, 2000), word("next", 7000, 8000, "Next", { y: 100 })],
    { bannerSpeed: 10000, bannerRectangleOpacity: 0 }
  );
  const layout = layoutBanner(input, measure);
  const first = [...bannerPlayheadsAt(layout, 500).values()];
  assert.equal(first.length, 1);
  assert.equal(first[0].y, 180);
  assert.equal(first[0].opacity, 0.5);
  const next = [...bannerPlayheadsAt(layout, 6500).values()];
  assert.equal(next.length, 1);
  assert.equal(next[0].y, 280);
  assert.equal(next[0].opacity, 0.5);
});
