import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, access } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);
const { loadProject } = require("../electron/projects.cjs");

function wav() {
  const buffer = Buffer.alloc(48);
  buffer.write("RIFF");
  buffer.writeUInt32LE(40, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(2, 24);
  buffer.writeUInt32LE(4, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(4, 40);
  return buffer;
}
async function fixture(t, status = "failed") {
  const root = await mkdtemp(path.join(tmpdir(), "karaokai-recovery-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "projects", "project-test");
  await mkdir(path.join(directory, "audio"), { recursive: true });
  const project = {
    id: "project-test",
    duration: 0,
    tracks: [{ id: "audio-main", type: "audio", source: "source.mp3" }],
    processing: [
      { id: "separation", status: "completed" },
      { id: "transcription", status, message: "AI error" },
      { id: "subtitles", status: "pending" },
    ],
  };
  await writeFile(
    path.join(directory, "project.json"),
    JSON.stringify(project)
  );
  return { root, directory, project };
}

test("failed transcription recovers a persistent editable project with empty subtitles", async (t) => {
  const { root, directory } = await fixture(t);
  for (const name of ["vocals.wav", "instrumental.wav"])
    await writeFile(path.join(directory, "audio", name), wav());
  const recovered = await loadProject(root, "project-test");
  assert.equal(recovered.duration, 1000);
  assert.equal(recovered.tracks[0].source, "instrumental.wav");
  assert.deepEqual(
    recovered.tracks.find((track) => track.id === "subtitles-main").phrases,
    []
  );
  assert.ok(
    recovered.processing.every(
      (stage) => !["pending", "running"].includes(stage.status)
    )
  );
  assert.equal(recovered.processing[1].message, "AI error");
  assert.deepEqual(await loadProject(root, "project-test"), recovered);
  recovered.tracks[1].phrases.push({ id: "manual-phrase" });
  await writeFile(
    path.join(directory, "project.json"),
    JSON.stringify(recovered)
  );
  assert.deepEqual(
    (await loadProject(root, "project-test")).tracks[1].phrases,
    [{ id: "manual-phrase" }]
  );
});
for (const kind of ["missing", "truncated"]) {
  test(`failed processing removes project with ${kind} stems`, async (t) => {
    const { root, directory } = await fixture(t);
    await writeFile(path.join(directory, "audio", "vocals.wav"), wav());
    if (kind === "truncated")
      await writeFile(
        path.join(directory, "audio", "instrumental.wav"),
        wav().subarray(0, 45)
      );
    assert.equal(await loadProject(root, "project-test"), null);
    await assert.rejects(access(directory), { code: "ENOENT" });
  });
}
test("pending transcription is preserved while waiting for lyrics", async (t) => {
  const { root, project } = await fixture(t, "pending");
  assert.deepEqual(await loadProject(root, "project-test"), project);
});
