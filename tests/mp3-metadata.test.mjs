import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { parseMp3Metadata } = require("../electron/mp3-metadata.cjs");

test("MP3 metadata parser reads artist and title without chapter tags", () => {
  assert.deepEqual(
    parseMp3Metadata(
      ";FFMETADATA1\nartist=Artist\\; Name\ntitle=Song\\= One\n[CHAPTER]\ntitle=Wrong title\n"
    ),
    { artist: "Artist; Name", song: "Song= One" }
  );
  assert.deepEqual(parseMp3Metadata(";FFMETADATA1\nencoder=FFmpeg\n"), {
    artist: "",
    song: "",
  });
});
