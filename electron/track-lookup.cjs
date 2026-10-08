const { spawn } = require("node:child_process");
let lrclibRetryAt = 0;

function processOutput(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      error += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) =>
      code === 0
        ? resolve(output.trim())
        : reject(new Error(error.trim() || `FFmpeg exited with ${code}`))
    );
  });
}

async function fingerprint(ffmpeg, source) {
  const [durationText, value] = await Promise.all([
    processOutput(ffmpeg, [
      "-v",
      "error",
      "-i",
      source,
      "-map",
      "0:a:0",
      "-c",
      "copy",
      "-progress",
      "pipe:1",
      "-f",
      "null",
      "-",
    ]),
    processOutput(ffmpeg, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      source,
      "-map",
      "0:a:0",
      "-t",
      "120",
      "-ac",
      "1",
      "-ar",
      "11025",
      "-f",
      "chromaprint",
      "-fp_format",
      "base64",
      "-",
    ])
      .catch(() =>
        processOutput("ffmpeg", [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          source,
          "-map",
          "0:a:0",
          "-t",
          "120",
          "-ac",
          "1",
          "-ar",
          "11025",
          "-f",
          "chromaprint",
          "-fp_format",
          "base64",
          "-",
        ])
      )
      .catch(
        async () =>
          JSON.parse(
            await processOutput("fpcalc", ["-length", "120", "-json", source])
          ).fingerprint
      ),
  ]);
  const times = [...durationText.matchAll(/out_time_us=(\d+)/g)];
  const fullDuration = Number(times.at(-1)?.[1] ?? 0) / 1_000_000;
  if (!value || !fullDuration)
    throw new Error("Could not fingerprint the imported audio");
  return { value, duration: Math.round(fullDuration), fullDuration };
}

async function jsonRequest(url, service, options = {}) {
  if (service === "LRCLIB" && Date.now() < lrclibRetryAt)
    throw new Error("LRCLIB_RATE_LIMITED");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "KaraokAI/1.2 (https://github.com/TramontaG/Karaokai)",
          ...options.headers,
        },
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw new Error(`${service}_NETWORK`);
    }
    if (response.status === 404) return null;
    if (response.status === 503 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      continue;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (service === "ACOUSTID" && data?.error?.message === "invalid API key")
        throw new Error("ACOUSTID_INVALID_KEY");
      if (response.status === 503) throw new Error(`${service}_UNAVAILABLE`);
      if (response.status === 429) {
        if (service === "LRCLIB") {
          const retry = response.headers?.get("Retry-After");
          const seconds = Number(retry);
          const date = Date.parse(retry ?? "");
          lrclibRetryAt =
            retry !== null && Number.isFinite(seconds)
              ? Date.now() + Math.max(0, seconds) * 1000
              : Number.isFinite(date)
                ? Math.max(date, Date.now())
                : Date.now() + 30_000;
        }
        throw new Error(`${service}_RATE_LIMITED`);
      }
      throw new Error(`${service}_HTTP_${response.status}`);
    }
    if (!data) throw new Error(`${service}_INVALID_RESPONSE`);
    return data;
  }
}

async function identify(ffmpeg, source, clientKey) {
  const print = await fingerprint(ffmpeg, source);
  if (!clientKey)
    return {
      fingerprint: print.value,
      duration: print.fullDuration,
      match: null,
    };
  const params = new URLSearchParams({
    client: clientKey,
    duration: String(print.duration),
    fingerprint: print.value,
    meta: "recordings+releasegroups",
  }).toString();
  let data;
  try {
    data = await jsonRequest("https://api.acoustid.org/v2/lookup", "ACOUSTID", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (data?.status !== "ok")
      throw new Error(data?.error?.message || "AcoustID lookup failed");
  } catch (error) {
    return {
      fingerprint: print.value,
      duration: print.fullDuration,
      match: null,
      error: error instanceof Error ? error.message : "ACOUSTID_NETWORK",
    };
  }
  const candidates = (data.results ?? []).flatMap((result) =>
    (result.recordings ?? []).map((recording) => ({
      score: result.score ?? 0,
      artist: (recording.artists ?? [])
        .map((artist) => artist.name)
        .filter(Boolean)
        .join(", "),
      song: recording.title ?? "",
    }))
  );
  const match =
    candidates
      .filter((item) => item.artist && item.song)
      .sort((a, b) => b.score - a.score)[0] ?? null;
  return { fingerprint: print.value, duration: print.fullDuration, match };
}

function parseSyncedLyrics(value) {
  const lines = [];
  for (const sourceLine of String(value ?? "").split(/\r?\n/)) {
    const match = sourceLine.match(
      /^\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/
    );
    if (!match || !match[4].trim()) continue;
    const fraction = Number((match[3] ?? "0").padEnd(3, "0"));
    lines.push({
      start: Number(match[1]) * 60 + Number(match[2]) + fraction / 1000,
      text: match[4].trim(),
    });
  }
  return lines.sort((a, b) => a.start - b.start);
}

async function lyricsFor(artist, song, duration) {
  const url = new URL("https://lrclib.net/api/get");
  url.search = new URLSearchParams({
    artist_name: artist,
    track_name: song,
    ...(duration > 0 ? { duration: String(Math.round(duration)) } : {}),
  }).toString();
  const exact = await jsonRequest(url, "LRCLIB");
  let record = exact?.syncedLyrics ? exact : null;
  let syncLookupError = null;
  if (!record) {
    const search = new URL("https://lrclib.net/api/search");
    search.search = new URLSearchParams({
      artist_name: artist,
      track_name: song,
    }).toString();
    try {
      const results = await jsonRequest(search, "LRCLIB");
      const normalized = (value) =>
        String(value ?? "")
          .trim()
          .toLocaleLowerCase();
      const candidates = (Array.isArray(results) ? results : [])
        .filter(
          (item) =>
            (item.syncedLyrics || item.plainLyrics) &&
            !item.instrumental &&
            normalized(item.artistName) === normalized(artist) &&
            normalized(item.trackName) === normalized(song)
        )
        .sort(
          (a, b) =>
            Math.abs(a.duration - duration) - Math.abs(b.duration - duration)
        );
      record =
        candidates.find(
          (item) => parseSyncedLyrics(item.syncedLyrics).length
        ) ??
        candidates[0] ??
        null;
    } catch (error) {
      if (!exact?.plainLyrics?.trim()) throw error;
      syncLookupError =
        error instanceof Error ? error.message : "LRCLIB_NETWORK";
    }
  }
  record ??= exact;
  if (!record) return null;
  const lines = parseSyncedLyrics(record.syncedLyrics);
  const plainLyrics = lines.length
    ? lines.map((line) => line.text).join("\n")
    : String(record.plainLyrics ?? "").trim();
  if (!plainLyrics) return null;
  return {
    id: record.id,
    artist: record.artistName,
    song: record.trackName,
    syncedLyrics: lines.length ? record.syncedLyrics : "",
    plainLyrics,
    syncLookupError,
  };
}

module.exports = { identify, lyricsFor, parseSyncedLyrics };
