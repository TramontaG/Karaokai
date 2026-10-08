const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

function parseMp3Metadata(output) {
  const tags = {};
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith("[")) break;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (!["artist", "album_artist", "title"].includes(key)) continue;
    const value = match[2]
      .replace(/\\([\\;#=])/g, "$1")
      .replace(/\0/g, "")
      .trim()
      .slice(0, 160);
    if (value) tags[key] = value;
  }
  return {
    artist: tags.artist ?? tags.album_artist ?? "",
    song: tags.title ?? "",
  };
}

async function readMp3Metadata(ffmpeg, source) {
  const { stdout } = await execFileAsync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      source,
      "-f",
      "ffmetadata",
      "-",
    ],
    { encoding: "utf8", maxBuffer: 256 * 1024, timeout: 10_000 }
  );
  return parseMp3Metadata(stdout);
}

module.exports = { parseMp3Metadata, readMp3Metadata };
