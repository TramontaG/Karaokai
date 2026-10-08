import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { run } = require("../electron/projects.cjs");

function wav() {
  const buffer = Buffer.alloc(48);
  buffer.write("RIFF");
  buffer.writeUInt32LE(40, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(44100, 24);
  buffer.writeUInt32LE(88200, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(4, 40);
  return buffer;
}

test("confirmed lyrics wait for separation and automatically start transcription", async (t) => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "karaokai-queued-lyrics-")
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, "source.wav");
  await fs.writeFile(source, wav());
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
mode=""
source=""
directory=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --separate) mode="separate"; shift ;;
    --transcribe) mode="transcribe"; shift ;;
    --source) source="$2"; shift 2 ;;
    --project-directory) directory="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [ "$mode" = "separate" ]; then
  sleep 0.5
  cp "$source" "$directory/audio/vocals.wav"
  cp "$source" "$directory/audio/instrumental.wav"
  printf '%s\\n' '{"type":"project.progress","stage":"separation","progress":100}'
  exit 0
fi
if [ "$mode" = "transcribe" ]; then
  printf '%s\\n' start >> "$directory/cache/transcription-started"
  exit 1
fi
exit 2
`,
    { mode: 0o755 }
  );
  const context = { dataRoot: () => root, emit: () => {} };
  const project = await run(
    "create_local_project",
    {
      sourcePath: source,
      whisperModelId: "test-whisper",
      demucsModelId: "test-demucs",
    },
    context
  );
  await run(
    "confirm_project_track",
    { projectId: project.id, artist: "Artist", song: "Song" },
    context
  );
  await run(
    "continue_project_processing",
    { projectId: project.id, lyrics: "Confirmed lyrics" },
    context
  );
  assert.equal(
    (await run("load_project", { projectId: project.id }, context))
      .lyricsQueued,
    true
  );
  await assert.rejects(
    run(
      "continue_project_processing",
      { projectId: project.id, lyrics: "Duplicate" },
      context
    ),
    /not ready/
  );
  const marker = path.join(
    root,
    "projects",
    project.id,
    "cache",
    "transcription-started"
  );
  let started = false;
  const deadline = Date.now() + 4000;
  while (!started && Date.now() < deadline) {
    started = await fs.access(marker).then(
      () => true,
      () => false
    );
    if (!started) await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert.equal(
    started,
    true,
    "Transcription must start without another confirmation"
  );
  assert.equal(
    await fs.readFile(
      path.join(root, "projects", project.id, "cache", "provided-lyrics.txt"),
      "utf8"
    ),
    "Confirmed lyrics"
  );
  let failed = false;
  while (!failed && Date.now() < deadline) {
    failed =
      (
        await run("load_project", { projectId: project.id }, context)
      ).processing.find((stage) => stage.id === "transcription")?.status ===
      "failed";
    if (!failed) await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert.equal(failed, true, "The failed transcription is available for retry");
  assert.deepEqual(
    await run(
      "retry_project_transcription",
      { projectId: project.id },
      context
    ),
    { hasLyrics: true }
  );
  let attempts = 0;
  const retryDeadline = Date.now() + 4000;
  while (attempts < 2 && Date.now() < retryDeadline) {
    attempts = (await fs.readFile(marker, "utf8")).trim().split("\n").length;
    if (attempts < 2) await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert.equal(attempts, 2, "Retry starts transcription again");
  assert.equal(
    await fs.readFile(
      path.join(root, "projects", project.id, "cache", "provided-lyrics.txt"),
      "utf8"
    ),
    "Confirmed lyrics",
    "Retry preserves the supplied lyrics"
  );
});
