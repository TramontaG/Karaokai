import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/screens/EditorScreen/timeline.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { joinSubtitlePhrases } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("joins selected phrases chronologically and preserves an explicit gap", () => {
  const first = {
    id: "first",
    text: "Hello",
    start: 1_000,
    end: 1_400,
    style: { scale: 1.2 },
    words: [{ id: "hello", text: "Hello", start: 1_000, end: 1_400 }],
  };
  const second = {
    id: "second",
    text: "world",
    start: 2_000,
    end: 2_500,
    words: [{ id: "world", text: "world", start: 2_000, end: 2_500 }],
  };

  assert.deepEqual(joinSubtitlePhrases([second, first]), {
    id: "first",
    text: "Hello world",
    start: 1_000,
    end: 2_500,
    style: { scale: 1.2 },
    words: [
      { id: "hello", text: "Hello", start: 1_000, end: 1_400 },
      {
        id: "gap-hello-second",
        type: "gap",
        text: "",
        start: 1_400,
        end: 2_000,
      },
      { id: "world", text: "world", start: 2_000, end: 2_500 },
    ],
  });
});

test("requires at least two phrases", () => {
  assert.equal(joinSubtitlePhrases([]), null);
  assert.equal(
    joinSubtitlePhrases([
      { id: "one", text: "one", start: 0, end: 1, words: [] },
    ]),
    null
  );
});
