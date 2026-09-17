const fs = require("node:fs/promises");
const path = require("node:path");

async function wavDuration(file) {
  const handle = await fs.open(file, "r");
  try {
    const { size } = await handle.stat();
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    if (
      header.toString("ascii", 0, 4) !== "RIFF" ||
      header.toString("ascii", 8, 12) !== "WAVE"
    )
      throw new Error("Invalid WAV");
    let rate = 0;
    let bytes = 0;
    for (let offset = 12; offset + 8 <= size;) {
      const chunk = Buffer.alloc(8);
      await handle.read(chunk, 0, 8, offset);
      const length = chunk.readUInt32LE(4);
      const start = offset + 8;
      if (start + length > size) throw new Error("Incomplete WAV");
      const kind = chunk.toString("ascii", 0, 4);
      if (kind === "fmt " && length >= 16) {
        const format = Buffer.alloc(16);
        await handle.read(format, 0, 16, start);
        rate = format.readUInt32LE(8);
      }
      if (kind === "data") bytes += length;
      offset = start + length + (length % 2);
    }
    if (!rate || !bytes) throw new Error("Empty WAV");
    return bytes / rate;
  } finally {
    await handle.close();
  }
}

async function recoverFailedProject(directory, project) {
  if (!project.processing.some((stage) => stage.status === "failed"))
    return project;
  let duration;
  try {
    const durations = await Promise.all(
      ["instrumental.wav", "vocals.wav"].map((name) =>
        wavDuration(path.join(directory, "audio", name))
      )
    );
    duration = durations[0];
  } catch (error) {
    // Permission and I/O errors do not establish that audio is missing or corrupt.
    if (error.code && error.code !== "ENOENT") throw error;
    await fs.rm(directory, { recursive: true, force: true });
    return null;
  }
  const audio = project.tracks.find((track) => track.id === "audio-main");
  if (audio) audio.source = "instrumental.wav";
  if (!project.tracks.some((track) => track.id === "subtitles-main")) {
    project.tracks.push({
      id: "subtitles-main",
      type: "subtitle",
      name: "Karaoke",
      visible: true,
      locked: false,
      zIndex: 20,
      style: {
        unreadColor: "#FFFFFF",
        readColor: "#FF0044",
        scale: 1,
        x: 0,
        y: 30,
      },
      curve: "linear",
      animation: { template: "template-1" },
      phrases: [],
    });
  }
  project.duration = Math.round(duration * 1000);
  for (const stage of project.processing) {
    if (stage.id === "separation")
      Object.assign(stage, { status: "completed", progress: 100 });
    else if (stage.status === "pending" || stage.status === "running")
      Object.assign(stage, { status: "failed", progress: 0 });
  }
  return project;
}
module.exports = { recoverFailedProject };
