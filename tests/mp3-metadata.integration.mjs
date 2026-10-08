import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { readMp3Metadata } = require("../electron/mp3-metadata.cjs");
const { run } = require("../electron/projects.cjs");

const ffmpegAvailable =
  spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=mono",
      "-t",
      "0.05",
      "-f",
      "mp3",
      "-",
    ],
    { stdio: "ignore" }
  ).status === 0;

test(
  "MP3 tags prefill a new project without confirming its metadata",
  { skip: !ffmpegAvailable },
  async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-mp3-tags-"));
    const source = path.join(root, "Filename fallback.mp3");
    const ffmpeg = path.join(
      root,
      "runtime",
      "ffmpeg",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
    );
    try {
      fs.mkdirSync(path.dirname(ffmpeg), { recursive: true });
      const systemFfmpeg = process.env.PATH.split(path.delimiter)
        .map((directory) =>
          path.join(
            directory,
            process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
          )
        )
        .find((candidate) => fs.existsSync(candidate));
      assert.ok(systemFfmpeg);
      fs.copyFileSync(systemFfmpeg, ffmpeg);
      if (process.platform !== "win32") fs.chmodSync(ffmpeg, 0o755);
      execFileSync("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=mono",
        "-t",
        "0.2",
        "-metadata",
        "artist=Tagged Artist",
        "-metadata",
        "title=Tagged Song",
        "-codec:a",
        "libmp3lame",
        source,
      ]);
      assert.deepEqual(await readMp3Metadata(ffmpeg, source), {
        artist: "Tagged Artist",
        song: "Tagged Song",
      });
      const project = await run(
        "create_local_project",
        {
          sourcePath: source,
          whisperModelId: "test-whisper",
          demucsModelId: "test-demucs",
        },
        { dataRoot: () => root, emit: () => {} }
      );
      assert.equal(project.artist, "Tagged Artist");
      assert.equal(project.song, "Tagged Song");
      assert.equal(project.name, "Filename fallback");
      assert.equal(project.metadataConfirmed, false);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
);
