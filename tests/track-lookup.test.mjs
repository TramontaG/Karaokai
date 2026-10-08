import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  parseSyncedLyrics,
  lyricsFor,
} = require("../electron/track-lookup.cjs");

test("LRCLIB lines retain their text and millisecond timestamps", () => {
  assert.deepEqual(
    parseSyncedLyrics(
      "[ar:Artist]\n[00:02.40] First line\n[00:04.125] Second line\n[00:06.00]"
    ),
    [
      { start: 2.4, text: "First line" },
      { start: 4.125, text: "Second line" },
    ]
  );
});

test("a temporary LRCLIB failure is retried once", async () => {
  const originalFetch = global.fetch;
  let requests = 0;
  global.fetch = async () => {
    requests += 1;
    if (requests === 1) return { status: 503, json: async () => null };
    return {
      status: 200,
      ok: true,
      json: async () => ({
        id: 1,
        artistName: "Artist",
        trackName: "Song",
        syncedLyrics: "[00:01.00] Hello world",
      }),
    };
  };
  try {
    assert.equal(
      (await lyricsFor("Artist", "Song", 4)).plainLyrics,
      "Hello world"
    );
    assert.equal(requests, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("repeated LRCLIB 503 remains visible to the caller", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ status: 503, json: async () => null });
  try {
    await assert.rejects(lyricsFor("Artist", "Song", 4), /LRCLIB_UNAVAILABLE/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("plain lyrics remain usable when timed lyric search fails", async () => {
  const originalFetch = global.fetch;
  let requests = 0;
  global.fetch = async () => {
    requests += 1;
    if (requests === 1)
      return {
        status: 200,
        ok: true,
        json: async () => ({
          id: 7,
          artistName: "Artist",
          trackName: "Song",
          syncedLyrics: null,
          plainLyrics: "First line\nSecond line",
        }),
      };
    return { status: 503, json: async () => null };
  };
  try {
    const lyrics = await lyricsFor("Artist", "Song", 120);
    assert.equal(lyrics.plainLyrics, "First line\nSecond line");
    assert.equal(lyrics.syncedLyrics, "");
    assert.equal(lyrics.syncLookupError, "LRCLIB_UNAVAILABLE");
    assert.equal(requests, 3);
  } finally {
    global.fetch = originalFetch;
  }
});

test("no matching lyrics are distinct from a request error", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) =>
    String(url).includes("/api/get")
      ? { status: 404 }
      : { status: 200, ok: true, json: async () => [] };
  try {
    assert.equal(await lyricsFor("Artist", "Song", 120), null);
  } finally {
    global.fetch = originalFetch;
  }
});
