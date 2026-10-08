import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/util/editor/tempoGrid.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  tempoGridLines,
  nearestGridTime,
  snapTimeToGrid,
  alignSubtitlePhrasesToGrid,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("aligns every unlocked phrase and word to the visible grid", () => {
  const phrase = {
    id: "first",
    text: "Hello world",
    start: 100,
    end: 900,
    style: { scale: 1.2 },
    words: [
      { id: "hello", text: "Hello", start: 100, end: 400 },
      { id: "world", text: "world", start: 500, end: 900 },
    ],
  };
  const short = {
    id: "short",
    text: "Hey",
    start: 1100,
    end: 1200,
    words: [{ id: "hey", text: "Hey", start: 1100, end: 1200 }],
  };
  const project = {
    tracks: [
      {
        id: "lyrics",
        type: "subtitle",
        locked: false,
        phrases: [phrase, short],
      },
      { id: "locked", type: "subtitle", locked: true, phrases: [phrase] },
    ],
  };
  const lines = tempoGridLines(2000, 120, 0, 4);
  const result = alignSubtitlePhrasesToGrid(project, lines);
  assert.equal(result.alignedCount, 2);
  const [aligned, alignedShort] = result.project.tracks[0].phrases;
  assert.deepEqual([aligned.start, aligned.end], [0, 1000]);
  assert.deepEqual(
    aligned.words.map(({ start, end }) => [start, end]),
    [
      [0, 500],
      [500, 1000],
    ]
  );
  assert.equal(aligned.text, phrase.text);
  assert.deepEqual(aligned.style, phrase.style);
  assert.deepEqual([alignedShort.start, alignedShort.end], [1000, 1500]);
  assert.strictEqual(result.project.tracks[1].phrases[0], phrase);
  assert.equal(
    alignSubtitlePhrasesToGrid(result.project, lines).alignedCount,
    0
  );
});

test("aligns words when phrase bounds are already on the grid", () => {
  const project = {
    tracks: [
      {
        id: "lyrics",
        type: "subtitle",
        locked: false,
        phrases: [
          {
            id: "phrase",
            text: "Hello world",
            start: 0,
            end: 1000,
            words: [
              { id: "hello", text: "Hello", start: 0, end: 380 },
              { id: "world", text: "world", start: 530, end: 1000 },
            ],
          },
        ],
      },
    ],
  };
  const lines = tempoGridLines(1000, 120, 0, 4);
  const result = alignSubtitlePhrasesToGrid(project, lines);
  assert.equal(result.alignedCount, 1);
  assert.deepEqual(
    result.project.tracks[0].phrases[0].words.map(({ start, end }) => [
      start,
      end,
    ]),
    [
      [0, 500],
      [500, 1000],
    ]
  );
  assert.equal(
    alignSubtitlePhrasesToGrid(result.project, lines).alignedCount,
    0
  );
});

test("keeps dense phrases intact until the subdivision can fit every word", () => {
  const project = {
    tracks: [
      {
        id: "lyrics",
        type: "subtitle",
        locked: false,
        phrases: [
          {
            id: "phrase",
            text: "One two three four",
            start: 0,
            end: 1000,
            words: [
              { id: "one", text: "One", start: 0, end: 200 },
              { id: "two", text: "two", start: 200, end: 450 },
              { id: "three", text: "three", start: 450, end: 700 },
              { id: "four", text: "four", start: 700, end: 1000 },
            ],
          },
        ],
      },
    ],
  };
  const coarse = alignSubtitlePhrasesToGrid(
    project,
    tempoGridLines(1000, 120, 0, 4)
  );
  assert.equal(coarse.alignedCount, 0);
  assert.strictEqual(coarse.project, project);
  const fine = alignSubtitlePhrasesToGrid(
    project,
    tempoGridLines(1000, 120, 0, 16)
  );
  assert.equal(fine.alignedCount, 1);
  const words = fine.project.tracks[0].phrases[0].words;
  assert.equal(words.length, 4);
  assert.ok(words.every((word) => word.end > word.start));
  const grid = new Set(
    tempoGridLines(1000, 120, 0, 16).map((line) => Math.round(line.time))
  );
  assert.ok(words.every((word) => grid.has(word.start) && grid.has(word.end)));
});

test("grid alignment follows tempo and time signature changes", () => {
  const lines = tempoGridLines(
    3000,
    120,
    0,
    4,
    [{ id: "signature", time: 1000, numerator: 3, denominator: 8 }],
    [{ id: "tempo", time: 1750, bpm: 60 }]
  );
  const project = {
    tracks: [
      {
        id: "lyrics",
        type: "subtitle",
        locked: false,
        phrases: [
          {
            id: "one",
            text: "One",
            start: 1060,
            end: 1830,
            words: [{ id: "word", text: "One", start: 1060, end: 1830 }],
          },
        ],
      },
    ],
  };
  const result = alignSubtitlePhrasesToGrid(project, lines);
  assert.equal(result.alignedCount, 1);
  const aligned = result.project.tracks[0].phrases[0];
  assert.ok(lines.some((line) => Math.round(line.time) === aligned.start));
  assert.ok(lines.some((line) => Math.round(line.time) === aligned.end));
});

test("grid alignment does not create overlaps between close phrases", () => {
  const project = {
    tracks: [
      {
        id: "lyrics",
        type: "subtitle",
        locked: false,
        phrases: [
          {
            id: "first",
            text: "A",
            start: 100,
            end: 220,
            words: [{ id: "a", text: "A", start: 100, end: 220 }],
          },
          {
            id: "second",
            text: "B",
            start: 280,
            end: 430,
            words: [{ id: "b", text: "B", start: 280, end: 430 }],
          },
        ],
      },
    ],
  };
  const result = alignSubtitlePhrasesToGrid(
    project,
    tempoGridLines(1000, 120, 0, 4)
  );
  assert.equal(result.alignedCount, 1);
  const [first, second] = result.project.tracks[0].phrases;
  assert.deepEqual([first.start, first.end], [100, 220]);
  assert.deepEqual([second.start, second.end], [500, 1000]);
  assert.ok(first.end <= second.start);
});

test("creates every subdivision at its exact timestamp", () => {
  assert.deepEqual(tempoGridLines(2_000, 120, 0, 4), [
    { time: 0, isBar: true },
    { time: 500, isBar: false },
    { time: 1_000, isBar: false },
    { time: 1_500, isBar: false },
    { time: 2_000, isBar: true },
  ]);
});

test("uses the tempo offset as the bar anchor without shifting line spacing", () => {
  assert.deepEqual(tempoGridLines(1_600, 120, 250, 4), [
    { time: 250, isBar: true },
    { time: 750, isBar: false },
    { time: 1_250, isBar: false },
  ]);
});

test("does not create lines before the first non-negative offset", () => {
  assert.deepEqual(tempoGridLines(600, 120, 250, 4), [
    { time: 250, isBar: true },
  ]);
  assert.deepEqual(tempoGridLines(0, 120, 0, 4), []);
});

const signature = (time, numerator, denominator, id = String(time)) => ({
  id,
  time,
  numerator,
  denominator,
});

test("switches 4/4 to 3/4 to 6/8 at markers, preserving eighth note resolution", () => {
  const lines = tempoGridLines(6500, 120, 0, 8, [
    signature(2000, 3, 4),
    signature(5000, 6, 8),
  ]);
  assert.deepEqual(
    lines.filter((line) => line.isBar).map((line) => line.time),
    [0, 2000, 3500, 5000, 6500]
  );
  assert.ok(
    lines.slice(1).every((line, index) => line.time - lines[index].time === 250)
  );
  assert.equal(lines.filter((line) => line.time === 5000).length, 1);
});

test("starts a fresh bar at a subdivision and restores the preceding signature after deletion", () => {
  const changes = [signature(500, 3, 4), signature(2500, 2, 4)];
  assert.deepEqual(
    tempoGridLines(4500, 120, 0, 4, changes)
      .filter((line) => line.isBar)
      .map((line) => line.time),
    [0, 500, 2000, 2500, 3500, 4500]
  );
  assert.deepEqual(
    tempoGridLines(4500, 120, 0, 4, changes.slice(0, 1))
      .filter((line) => line.isBar)
      .map((line) => line.time),
    [0, 500, 2000, 3500]
  );
});

test("includes every bar boundary even when the resolution is coarser than the beat unit", () => {
  assert.deepEqual(tempoGridLines(1500, 120, 0, 4, [signature(0, 3, 8)]), [
    { time: 0, isBar: true },
    { time: 500, isBar: false },
    { time: 750, isBar: true },
    { time: 1250, isBar: false },
    { time: 1500, isBar: true },
  ]);
});

test("anchors the default section to the offset and later sections to their own markers", () => {
  assert.deepEqual(
    tempoGridLines(4000, 120, 250, 8, [signature(750, 3, 4)])
      .filter((line) => line.isBar)
      .map((line) => line.time),
    [250, 750, 2250, 3750]
  );
});

test("sorts markers, resolves duplicate positions and ignores malformed or out-of-range changes", () => {
  const changes = [
    signature(3000, 3, 4),
    signature(0, 6, 8),
    signature(0, 2, 4),
    signature(2000, 0, 4),
    signature(-100, 3, 4),
    signature(1000, 4, 0),
    signature(8000, 3, 4),
  ];
  assert.deepEqual(
    tempoGridLines(4500, 120, 0, 4, changes)
      .filter((line) => line.isBar)
      .map((line) => line.time),
    [0, 1000, 2000, 3000, 4500]
  );
});

test("fractional BPM and mixed signatures keep all lines ordered and unique", () => {
  const lines = tempoGridLines(10000, 137.3, 17.4, 32, [
    signature(2500.5, 7, 8),
    signature(6712.1, 5, 16),
  ]);
  assert.ok(lines.every((line) => line.time >= 0 && line.time <= 10000));
  assert.ok(
    lines.slice(1).every((line, index) => line.time > lines[index].time)
  );
  assert.ok(lines.some((line) => line.time === 2500.5 && line.isBar));
  assert.ok(lines.some((line) => line.time === 6712.1 && line.isBar));
});

test("snapping selects an actual line across a signature boundary and clamps to grid ends", () => {
  const lines = tempoGridLines(2000, 120, 0, 4, [signature(0, 3, 8)]);
  assert.equal(nearestGridTime(lines, 700), 750);
  assert.equal(nearestGridTime(lines, 1100), 1250);
  assert.equal(nearestGridTime(lines, -100), 0);
  assert.equal(nearestGridTime(lines, 9000), 2000);
});

const tempoChange = (time, bpm) => ({ id: `tempo-${time}`, time, bpm });

test("tempo changes preserve the beat within the bar", () => {
  assert.deepEqual(
    tempoGridLines(3500, 120, 0, 4, [], [tempoChange(500, 60)]),
    [
      { time: 0, isBar: true },
      { time: 500, isBar: false },
      { time: 1500, isBar: false },
      { time: 2500, isBar: false },
      { time: 3500, isBar: true },
    ]
  );
});

test("multiple tempo changes carry phase forward until the next bar", () => {
  const lines = tempoGridLines(
    4000,
    120,
    0,
    4,
    [],
    [tempoChange(500, 60), tempoChange(1500, 240)]
  );
  assert.deepEqual(
    lines.filter((line) => line.isBar).map((line) => line.time),
    [0, 2000, 3000, 4000]
  );
  assert.equal(nearestGridTime(lines, 1830), 1750);
});

test("coincident signature and tempo changes start exactly one bar with both new values", () => {
  const lines = tempoGridLines(
    5000,
    120,
    0,
    8,
    [signature(2000, 3, 4)],
    [tempoChange(2000, 60)]
  );
  assert.deepEqual(
    lines.filter((line) => line.isBar).map((line) => line.time),
    [0, 2000, 5000]
  );
  assert.equal(lines.filter((line) => line.time === 2000).length, 1);
  assert.deepEqual(
    lines.filter((line) => line.time >= 2000).map((line) => line.time),
    [2000, 2500, 3000, 3500, 4000, 4500, 5000]
  );
});

test("tempo changes within 6/8 preserve eighth-note phase and the offset", () => {
  const lines = tempoGridLines(
    3250,
    120,
    250,
    8,
    [signature(250, 6, 8)],
    [tempoChange(750, 60)]
  );
  assert.deepEqual(
    lines.filter((line) => line.isBar).map((line) => line.time),
    [250, 2750]
  );
  assert.deepEqual(
    lines.filter((line) => line.time >= 750).map((line) => line.time),
    [750, 1250, 1750, 2250, 2750, 3250]
  );
});

test("unsorted, duplicate and invalid BPM markers cannot corrupt the grid", () => {
  const lines = tempoGridLines(
    4000,
    120,
    0,
    4,
    [],
    [
      tempoChange(2000, 80),
      tempoChange(0, 60),
      tempoChange(2000, 120),
      tempoChange(1000, 0),
      tempoChange(500, Infinity),
      tempoChange(-100, 90),
    ]
  );
  assert.deepEqual(
    lines.map((line) => line.time),
    [0, 1000, 2000, 2500, 3000, 3500, 4000]
  );
  assert.deepEqual(
    lines.filter((line) => line.isBar).map((line) => line.time),
    [0, 3000]
  );
});

test("snap preserves fractional grid times through JSON and project normalization", async () => {
  const domain = readFileSync(
    new URL("../src/domain/project.ts", import.meta.url),
    "utf8"
  );
  const { outputText } = ts.transpileModule(domain, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const { normalizeSubtitlePhraseOrder } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  const bpm = 137;
  const lines = tempoGridLines(10_000, bpm, 0, 4);
  const start = snapTimeToGrid(438, bpm, 0, 4);
  const end = snapTimeToGrid(876, bpm, 0, 4);
  assert.equal(start, lines[1].time);
  assert.equal(end, lines[2].time);
  assert.notEqual(start, Math.round(start));
  let project = {
    duration: 10_000,
    tempo: { bpm, offset: 0 },
    tracks: [
      {
        id: "track",
        type: "subtitle",
        style: {},
        phrases: [
          {
            id: "phrase",
            text: "Hello",
            start,
            end,
            words: [{ id: "word", text: "Hello", start, end }],
          },
        ],
      },
    ],
  };
  const original = structuredClone(project);
  for (let i = 0; i < 20; i++) {
    project = normalizeSubtitlePhraseOrder(JSON.parse(JSON.stringify(project)));
    assert.deepEqual(project, original);
  }
});
