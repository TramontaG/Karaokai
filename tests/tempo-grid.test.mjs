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
const { tempoGridLines } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

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
