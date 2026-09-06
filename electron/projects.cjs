const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { spawn } = require("node:child_process");

const audioRegistry = new Map();
let processingQueue = Promise.resolve();

function projectRoot(dataRoot, projectId) {
  if (!/^project-[a-zA-Z0-9-]+$/.test(projectId)) {
    throw new Error("Invalid project id");
  }
  return path.join(dataRoot, "projects", projectId);
}

async function readJson(file) {
  return JSON.parse(await fs.promises.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  const temporary = `${file}.${process.pid}-${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.writeFile(temporary, JSON.stringify(value, null, 2));
  await fs.promises.rename(temporary, file);
}

async function loadProject(dataRoot, projectId) {
  return readJson(path.join(projectRoot(dataRoot, projectId), "project.json"));
}

async function saveProject(dataRoot, project) {
  const directory = projectRoot(dataRoot, project.id);
  await fs.promises.access(directory);
  await writeJson(path.join(directory, "project.json"), project);
}

async function directorySize(directory) {
  const entries = await fs.promises
    .readdir(directory, { withFileTypes: true })
    .catch(() => []);
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return directorySize(entryPath);
      if (!entry.isFile()) return 0;
      return fs.promises
        .stat(entryPath)
        .then((stat) => stat.size)
        .catch(() => 0);
    })
  );
  return sizes.reduce((total, size) => total + size, 0);
}

function firstPhraseStart(project) {
  return project.tracks
    .filter((track) => track.type === "subtitle")
    .flatMap((track) => track.phrases ?? [])
    .map((phrase) => Number(phrase.start))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)[0];
}

function backgroundAsset(project) {
  const background = project.tracks.find(
    (track) => track.type === "background"
  );
  if (!background) return null;
  return background.videoAsset ?? background.imageAsset ?? background.asset;
}

function isVideoAsset(asset) {
  return [".mp4", ".mov", ".webm", ".mkv"].includes(
    path.extname(asset).toLowerCase()
  );
}

async function generateProjectThumbnail(dataRoot, projectId) {
  const directory = projectRoot(dataRoot, projectId);
  const project = await loadProject(dataRoot, projectId);
  const firstPhraseAt = firstPhraseStart(project);
  if (firstPhraseAt === undefined) return null;
  const asset = backgroundAsset(project);
  if (!asset) return null;
  const source = path.join(directory, "assets", path.basename(asset));
  if (!fs.existsSync(source)) return null;
  const thumbnailDirectory = path.join(directory, "thumbnails");
  await fs.promises.mkdir(thumbnailDirectory, { recursive: true });
  let thumbnail;
  if (isVideoAsset(asset)) {
    thumbnail = "first-phrase.jpg";
    await new Promise((resolve, reject) => {
      const process = spawn(ffmpegBinary(dataRoot), [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-stream_loop",
        "-1",
        "-ss",
        String(firstPhraseAt / 1000),
        "-i",
        source,
        "-frames:v",
        "1",
        path.join(thumbnailDirectory, thumbnail),
      ]);
      process.once("error", reject);
      process.once("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("Unable to capture the project background"));
      });
    });
  } else {
    thumbnail = `first-phrase${path.extname(asset).toLowerCase() || ".jpg"}`;
    await fs.promises.copyFile(
      source,
      path.join(thumbnailDirectory, thumbnail)
    );
  }
  await saveProject(dataRoot, { ...project, thumbnail });
  return thumbnail;
}

async function updateStage(directory, stageId, status, progress, message) {
  const file = path.join(directory, "project.json");
  const project = await readJson(file);
  const stage = project.processing.find((entry) => entry.id === stageId);
  if (!stage) throw new Error(`Unknown processing stage: ${stageId}`);
  Object.assign(stage, {
    status,
    progress: Math.max(0, Math.min(100, progress)),
    message,
  });
  project.updatedAt = String(Date.now());
  await writeJson(file, project);
}

function environment(dataRoot, demucsModelId) {
  return {
    ...process.env,
    HF_HOME: path.join(dataRoot, "cache", "huggingface"),
    MPLCONFIGDIR: path.join(dataRoot, "cache", "matplotlib"),
    PYTHONNOUSERSITE: "1",
    TORCH_HOME: path.join(dataRoot, "models", "demucs", demucsModelId),
    XDG_CACHE_HOME: path.join(dataRoot, "cache", "python"),
  };
}

function pythonBinary(dataRoot) {
  return process.platform === "win32"
    ? path.join(
        dataRoot,
        "runtime",
        "python-environment",
        "Scripts",
        "python.exe"
      )
    : path.join(dataRoot, "runtime", "python-environment", "bin", "python");
}

function ffmpegBinary(dataRoot) {
  return path.join(
    dataRoot,
    "runtime",
    "ffmpeg",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
}

function whisperModelDirectory(dataRoot, modelId) {
  return path.join(dataRoot, "models", "whisper", modelId);
}

function demucsModelName(modelId) {
  return (
    {
      "demucs-htdemucs": "htdemucs",
      "demucs-htdemucs-ft": "htdemucs_ft",
      "demucs-mdx-extra": "mdx_extra",
    }[modelId] ?? "htdemucs"
  );
}

async function findSource(directory) {
  const files = await fs.promises.readdir(path.join(directory, "audio"));
  const source = files.find((name) => name.startsWith("source."));
  if (!source) throw new Error("Project source audio is missing");
  return path.join(directory, "audio", source);
}

async function applyPipelineResult(directory) {
  const projectFile = path.join(directory, "project.json");
  const project = await readJson(projectFile);
  const transcription = await readJson(
    path.join(directory, "cache", "transcription.json")
  );
  const audio = project.tracks.find((track) => track.id === "audio-main");
  if (audio) audio.source = "instrumental.wav";
  project.tracks = project.tracks.filter(
    (track) => track.id !== "subtitles-main"
  );
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
    animation: {
      template: "template-1",
    },
    phrases: transcription.phrases ?? [],
  });
  project.duration = transcription.duration ?? 0;
  project.updatedAt = String(Date.now());
  await writeJson(projectFile, project);
}

async function processProject({
  dataRoot,
  directory,
  projectId,
  whisperModelId,
  demucsModelId,
  emit,
}) {
  const notify = async (stage, status, progress, message) => {
    await updateStage(directory, stage, status, progress, message);
    emit("project-processing-progress", {
      projectId,
      stage,
      status,
      progress,
      message,
    });
  };
  await notify("separation", "pending", 0, "Queued for audio processing");
  const task = async () => {
    const python = pythonBinary(dataRoot);
    await fs.promises.access(python);
    const source = await findSource(directory);
    await notify("separation", "running", 0, "Preparing Demucs");
    const child = spawn(
      python,
      [
        "-m",
        "karaoke_worker",
        "--project-pipeline",
        "--source",
        source,
        "--project-directory",
        directory,
        "--demucs-model",
        demucsModelName(demucsModelId),
        "--whisper-model-path",
        whisperModelDirectory(dataRoot, whisperModelId),
      ],
      {
        cwd: dataRoot,
        env: environment(dataRoot, demucsModelId),
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    const exitPromise = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    let workerError = "";
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    const lines = readline.createInterface({ input: child.stdout });
    for await (const line of lines) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type === "project.progress") {
        await notify(
          event.stage,
          event.progress >= 100 ? "completed" : "running",
          event.progress,
          event.message
        );
      }
      if (event.type === "project.failed") workerError = event.error;
    }
    const exitCode = await exitPromise;
    if (exitCode !== 0) {
      throw new Error(
        workerError || stderr.trim() || `Worker exited with ${exitCode}`
      );
    }
    await applyPipelineResult(directory);
  };
  processingQueue = processingQueue.then(task, task);
  try {
    await processingQueue;
    emit("project-processing-progress", {
      projectId,
      stage: "subtitles",
      status: "completed",
      progress: 100,
      message: "Karaoke ready",
    });
  } catch (error) {
    const project = await loadProject(dataRoot, projectId);
    const failedStage =
      ["subtitles", "transcription", "separation"].find(
        (id) =>
          project.processing.find((stage) => stage.id === id)?.status ===
          "running"
      ) ?? "separation";
    await notify(failedStage, "failed", 0, error.message);
  }
}

async function createLocalProject({
  dataRoot,
  sourcePath,
  whisperModelId,
  demucsModelId,
  emit,
}) {
  const source = path.resolve(sourcePath);
  const stat = await fs.promises.stat(source).catch(() => null);
  if (!stat?.isFile())
    throw new Error("The selected audio file does not exist");
  const projectId = `project-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const directory = projectRoot(dataRoot, projectId);
  for (const name of ["audio", "assets", "thumbnails", "cache"]) {
    await fs.promises.mkdir(path.join(directory, name), { recursive: true });
  }
  const copiedSource = `source${path.extname(source)}`;
  await fs.promises.copyFile(
    source,
    path.join(directory, "audio", copiedSource)
  );
  const now = String(Date.now());
  const project = {
    version: 1,
    id: projectId,
    name: path.basename(source, path.extname(source)),
    createdAt: now,
    updatedAt: now,
    duration: 0,
    tempo: {
      bpm: 120,
      offset: 0,
    },
    tracks: [
      {
        id: "background-main",
        type: "background",
        name: "Background",
        visible: true,
        locked: false,
        zIndex: -10,
        source: "solid-color",
      },
      {
        id: "audio-main",
        type: "audio",
        name: "Instrumental",
        visible: true,
        locked: false,
        zIndex: 0,
        source: copiedSource,
        volume: 1,
        muted: false,
      },
    ],
    processing: [
      { id: "import", status: "completed" },
      { id: "separation", status: "pending", modelId: demucsModelId },
      { id: "transcription", status: "pending", modelId: whisperModelId },
      { id: "subtitles", status: "pending" },
    ],
  };
  await writeJson(path.join(directory, "project.json"), project);
  void processProject({
    dataRoot,
    directory,
    projectId,
    whisperModelId,
    demucsModelId,
    emit,
  });
  return project;
}

async function run(command, args, context) {
  const dataRoot = context.dataRoot(args.storageDirectory);
  if (command === "create_local_project") {
    return createLocalProject({ dataRoot, emit: context.emit, ...args });
  }
  if (command === "load_project") return loadProject(dataRoot, args.projectId);
  if (command === "list_projects") {
    const directory = path.join(dataRoot, "projects");
    await fs.promises.mkdir(directory, { recursive: true });
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    });
    const projects = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try {
            const project = await loadProject(dataRoot, entry.name);
            const {
              id,
              name,
              duration,
              createdAt,
              updatedAt,
              processing,
              thumbnail,
            } = project;
            return {
              id,
              name,
              duration,
              sizeBytes: await directorySize(path.join(directory, entry.name)),
              createdAt,
              updatedAt,
              processing,
              thumbnail,
            };
          } catch {
            return null;
          }
        })
    );
    return projects
      .filter(Boolean)
      .sort((left, right) =>
        String(right.updatedAt).localeCompare(String(left.updatedAt))
      );
  }
  if (command === "save_project") {
    await saveProject(dataRoot, args.project);
    return null;
  }
  if (command === "rename_project") {
    const name = String(args.name ?? "").trim();
    if (!name) throw new Error("Project name cannot be empty");
    const project = await loadProject(dataRoot, args.projectId);
    await saveProject(dataRoot, {
      ...project,
      name,
      updatedAt: String(Date.now()),
    });
    return null;
  }
  if (command === "delete_project") {
    await fs.promises.rm(projectRoot(dataRoot, args.projectId), {
      recursive: true,
      force: true,
    });
    return null;
  }
  if (command === "duplicate_project") {
    const source = projectRoot(dataRoot, args.projectId);
    const duplicateId = `project-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const destination = projectRoot(dataRoot, duplicateId);
    await fs.promises.cp(source, destination, { recursive: true });
    const project = await loadProject(dataRoot, duplicateId);
    const now = String(Date.now());
    const duplicate = {
      ...project,
      id: duplicateId,
      name: `${project.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await saveProject(dataRoot, duplicate);
    return duplicate;
  }
  if (command === "open_project_folder") {
    await context.shell.openPath(projectRoot(dataRoot, args.projectId));
    return null;
  }
  if (command === "project_audio_sources") {
    const directory = projectRoot(dataRoot, args.projectId);
    const ffmpeg = ffmpegBinary(dataRoot);
    const cache = path.join(directory, "cache", "preview-audio");
    await fs.promises.mkdir(cache, { recursive: true });
    const prepare = async (stem) => {
      const source = path.join(directory, "audio", `${stem}.wav`);
      if (!fs.existsSync(source)) return null;
      const preview = path.join(cache, `${stem}.mp3`);
      const sourceTime = (await fs.promises.stat(source)).mtimeMs;
      const previewStat = await fs.promises.stat(preview).catch(() => null);
      if (
        !previewStat ||
        previewStat.size === 0 ||
        previewStat.mtimeMs < sourceTime
      ) {
        await new Promise((resolve, reject) => {
          const child = spawn(ffmpeg, [
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            source,
            "-vn",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            preview,
          ]);
          child.once("error", reject);
          child.once("close", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`FFmpeg exited with ${code}`))
          );
        });
      }
      const key = `${args.projectId}/${stem}.mp3`;
      audioRegistry.set(key, preview);
      return key;
    };
    const [instrumental, vocals] = await Promise.all([
      prepare("instrumental"),
      prepare("vocals"),
    ]);
    return { instrumental, vocals };
  }
  if (command === "read_project_audio") {
    const source = audioRegistry.get(args.sourceId);
    if (!source)
      throw new Error("Audio source is not registered for this project");
    return fs.promises.readFile(source);
  }
  if (command === "import_background_asset") {
    const source = path.resolve(args.sourcePath);
    const stat = await fs.promises.stat(source).catch(() => null);
    if (!stat?.isFile())
      throw new Error("The selected background file does not exist");
    const extension = path.extname(source).toLowerCase();
    const kind = args.kind === "video" ? "video" : "image";
    const asset = `background-${kind}${extension}`;
    const directory = path.join(
      projectRoot(dataRoot, args.projectId),
      "assets"
    );
    await fs.promises.mkdir(directory, { recursive: true });
    const existingAssets = await fs.promises.readdir(directory);
    await Promise.all(
      existingAssets
        .filter((name) => new RegExp(`^background-${kind}\\.`, "i").test(name))
        .map((name) =>
          fs.promises.rm(path.join(directory, name), { force: true })
        )
    );
    await fs.promises.copyFile(source, path.join(directory, asset));
    return asset;
  }
  if (command === "extract_album_art") {
    const directory = projectRoot(dataRoot, args.projectId);
    const source = await findSource(directory);
    const asset = "album-art.jpg";
    const destination = path.join(directory, "assets", asset);
    await new Promise((resolve, reject) => {
      const child = spawn(ffmpegBinary(dataRoot), [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        source,
        "-an",
        "-map",
        "0:v:0",
        "-frames:v",
        "1",
        destination,
      ]);
      child.once("error", reject);
      child.once("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error("No embedded album artwork was found"))
      );
    });
    return asset;
  }
  if (command === "read_project_asset") {
    const asset = path.basename(String(args.asset ?? ""));
    if (!asset) throw new Error("Invalid project asset");
    return fs.promises.readFile(
      path.join(projectRoot(dataRoot, args.projectId), "assets", asset)
    );
  }
  if (command === "generate_project_thumbnail") {
    return generateProjectThumbnail(dataRoot, args.projectId);
  }
  if (command === "read_project_thumbnail") {
    const thumbnail = path.basename(String(args.thumbnail ?? ""));
    if (!thumbnail) throw new Error("Invalid project thumbnail");
    return fs.promises.readFile(
      path.join(projectRoot(dataRoot, args.projectId), "thumbnails", thumbnail)
    );
  }
  if (command === "save_project_thumbnail") {
    const directory = projectRoot(dataRoot, args.projectId);
    const thumbnails = path.join(directory, "thumbnails");
    await fs.promises.mkdir(thumbnails, { recursive: true });
    await fs.promises.writeFile(
      path.join(thumbnails, "preview.jpg"),
      Buffer.from(args.bytes)
    );
    const project = await loadProject(dataRoot, args.projectId);
    await saveProject(dataRoot, { ...project, thumbnail: "preview.jpg" });
    return null;
  }
  return undefined;
}

module.exports = {
  run,
  projectRoot,
  loadProject,
  pythonBinary,
  ffmpegBinary,
};
