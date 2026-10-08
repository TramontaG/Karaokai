import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { run } = require("../electron/projects.cjs");

test("fine alignment invokes the worker for the selected phrase", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "karaokai-fine-align-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "projects", "project-test");
  await fs.mkdir(path.join(directory, "audio"), { recursive: true });
  await fs.writeFile(path.join(directory, "audio", "vocals.wav"), "vocals");
  const python = path.join(
    root,
    "runtime",
    "python-environment",
    "bin",
    "python"
  );
  await fs.mkdir(path.dirname(python), { recursive: true });
  await fs.writeFile(
    python,
    `#!/bin/sh
has_align=""
start=""
end=""
text=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --align-phrase) has_align="yes"; shift ;;
    --phrase-start) start="$2"; shift 2 ;;
    --phrase-end) end="$2"; shift 2 ;;
    --phrase-text) text="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [ "$has_align" != "yes" ] || [ "$start" != "2000" ] || [ "$end" != "3500" ] || [ "$text" != "Hello world" ]; then
  echo "Wrong alignment arguments" >&2
  exit 2
fi
printf '%s\\n' '{"type":"phrase.aligned","start":2250,"end":3400,"words":[{"text":"Hello","start":2250,"end":2700},{"text":"world","start":2950,"end":3400}]}'
`,
    { mode: 0o755 }
  );
  const context = { dataRoot: () => root };
  const result = await run(
    "align_project_phrase",
    { projectId: "project-test", text: "Hello world", start: 2000, end: 3500 },
    context
  );
  assert.deepEqual(result, {
    start: 2250,
    end: 3400,
    words: [
      { text: "Hello", start: 2250, end: 2700 },
      { text: "world", start: 2950, end: 3400 },
    ],
  });
  await assert.rejects(
    run(
      "align_project_phrase",
      { projectId: "project-test", text: "", start: 2000, end: 3500 },
      context
    ),
    /Invalid phrase/
  );
});
