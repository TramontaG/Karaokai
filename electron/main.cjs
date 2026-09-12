const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const projects = require("./projects.cjs");
const runtime = require("./runtime.cjs");
const { frameBitmap } = require("./render-frames.cjs");
const { stampHeight } = require("./render-frame-format.json");

const PROJECT_COMMANDS = new Set([
  "create_local_project",
  "create_youtube_project",
  "continue_project_processing",
  "load_project",
  "list_projects",
  "save_project",
  "rename_project",
  "delete_project",
  "duplicate_project",
  "open_project_folder",
  "project_audio_sources",
  "read_project_audio",
  "import_background_asset",
  "extract_album_art",
  "read_project_asset",
  "generate_project_thumbnail",
  "read_project_thumbnail",
  "save_project_thumbnail",
  "start_project_render",
  "cancel_project_render",
  "render_job_data",
  "youtube_cookies_status",
  "save_youtube_cookies",
  "remove_youtube_cookies",
]);
const renderJobs = new Map();
const RENDER_FRAME_RATE = 240;
const VIDEO_ASSET_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const X264_PRESETS = new Set([
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
]);

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function defaultDataRoot() {
  if (process.platform === "linux") {
    return path.join(
      app.getPath("home"),
      ".local",
      "share",
      "com.karaokai.app"
    );
  }
  return path.join(app.getPath("appData"), "com.karaokai.app");
}

function dataRoot(storageDirectory) {
  return typeof storageDirectory === "string" && storageDirectory.trim()
    ? path.join(path.resolve(storageDirectory), "KaraokAI")
    : defaultDataRoot();
}

function emit(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed())
      window.webContents.send(`karaokai:event:${channel}`, payload);
  }
}

function nativeContext() {
  return {
    appPath: app.isPackaged ? process.resourcesPath : app.getAppPath(),
    dataRoot,
    emit,
    shell,
  };
}

function renderUrl() {
  return app.isPackaged
    ? path.join(app.getAppPath(), "dist", "index.html")
    : "http://127.0.0.1:1420";
}

function failRenderJob(job, error) {
  if (job.finished) return;
  job.finished = true;
  job.cancelled = true;
  for (const worker of job.workers ?? [job]) {
    worker.finished = true;
    clearTimeout(worker.frameTimeout);
    worker.ffmpeg.stdin.destroy();
    worker.ffmpeg.kill();
    if (!worker.window.isDestroyed()) worker.window.destroy();
    renderJobs.delete(worker.jobId);
  }
  job.finalizer?.kill();
  void fs.promises.rm(job.partialPath, { force: true });
  void fs.promises.rm(job.temporaryDirectory, { recursive: true, force: true });
  emit("project-render-progress", {
    jobId: job.jobId,
    status: "failed",
    error: String(error),
  });
  renderJobs.delete(job.jobId);
}

function stopRenderForEncoderFailure(job, error) {
  if (job.finished || job.encoderFailure) return;
  job.encoderFailure = String(error);
  job.ffmpeg.stdin.destroy();
}

function ffmpegFailureMessage(job, code, signal) {
  const context = [
    job.encoderFailure,
    job.ffmpegError.trim(),
    `FFmpeg exited with code ${code}${signal ? ` (signal ${signal})` : ""} while encoding frame ${job.frame}/${job.totalFrames} at ${((job.frame / job.args.fps) * 1000).toFixed(0)} ms.`,
  ].filter(Boolean);
  return context.join("\n\n");
}

function runFfmpeg(binary, arguments_) {
  const process = spawn(binary, arguments_);
  const completion = new Promise((resolve, reject) => {
    let stderr = "";
    process.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-16_384);
    });
    process.once("error", reject);
    process.once("close", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            stderr.trim() ||
              `FFmpeg exited with code ${code}${signal ? ` (signal ${signal})` : ""}`
          )
        );
    });
  });
  return { process, completion };
}

function probeVideoDuration(binary, videoPath) {
  const process = spawn(binary, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    videoPath,
    "-map",
    "0:v:0",
    "-c",
    "copy",
    "-f",
    "null",
    "-",
    "-progress",
    "pipe:1",
    "-nostats",
  ]);
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    process.stdout.on("data", (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-16_384);
    });
    process.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-16_384);
    });
    process.once("error", reject);
    process.once("close", (code) => {
      const duration = Number(
        [...stdout.matchAll(/^out_time_us=(\d+)$/gm)].at(-1)?.[1]
      );
      if (code === 0 && Number.isFinite(duration) && duration > 0)
        resolve(duration / 1_000_000);
      else
        reject(
          new Error(
            stderr.trim() || `Unable to determine background video duration`
          )
        );
    });
  });
}

function audioArguments(instrumental, vocals, args) {
  const audioInputs = [];
  const filterParts = [];
  let inputIndex = 1;
  if (instrumental) {
    audioInputs.push("-i", instrumental);
    filterParts.push(
      `[${inputIndex}:a]volume=${args.instrumentalVolume}[instrumental]`
    );
    inputIndex += 1;
  }
  if (vocals) {
    audioInputs.push("-i", vocals);
    filterParts.push(`[${inputIndex}:a]volume=${args.vocalsVolume}[vocals]`);
  }
  const audioLabels = [instrumental && "[instrumental]", vocals && "[vocals]"]
    .filter(Boolean)
    .join("");
  filterParts.push(
    `${audioLabels}amix=inputs=${Number(Boolean(instrumental)) + Number(Boolean(vocals))}:normalize=0[audio]`
  );
  return { audioInputs, filter: filterParts.join(";") };
}

function projectVideoBackground(project, directory) {
  const background = project.tracks.find(
    (track) => track.type === "background"
  );
  if (!background || background.preset !== "video") return null;
  const legacyAsset =
    background.asset &&
    VIDEO_ASSET_EXTENSIONS.has(path.extname(background.asset).toLowerCase())
      ? background.asset
      : null;
  const asset = background.videoAsset ?? legacyAsset;
  if (!asset) return null;
  const assetPath = path.join(directory, "assets", path.basename(asset));
  if (!fs.existsSync(assetPath))
    throw new Error(`Background video asset is missing: ${asset}`);
  return {
    path: assetPath,
    fit: background.fit === "contain" ? "contain" : "cover",
    color: /^#[0-9a-f]{6}$/i.test(background.color ?? "")
      ? background.color.slice(1)
      : "0b1732",
  };
}

function videoCompositeArguments(parent, frameStart) {
  if (!parent.videoBackground) return { inputs: [], output: ["-map", "0:v"] };
  const { width, height, fps } = parent.args;
  const seekTime = (frameStart / fps) % parent.videoBackground.duration;
  const fittedBackground =
    parent.videoBackground.fit === "contain"
      ? `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=bilinear,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x${parent.videoBackground.color}`
      : `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=bilinear,crop=${width}:${height}`;
  const filter = [
    `[1:v]fps=${fps},setpts=PTS-STARTPTS[background-tail]`,
    `[2:v]fps=${fps},setpts=PTS-STARTPTS[background-loop]`,
    "[background-tail][background-loop]concat=n=2:v=1:a=0[background-sequence]",
    `[background-sequence]${fittedBackground},setsar=1[background]`,
    "[0:v]format=rgba,setpts=PTS-STARTPTS[overlay]",
    "[background][overlay]overlay=format=auto:alpha=premultiplied,format=yuv420p[video]",
  ].join(";");
  return {
    inputs: [
      "-ss",
      String(seekTime),
      "-i",
      parent.videoBackground.path,
      "-stream_loop",
      "-1",
      "-i",
      parent.videoBackground.path,
    ],
    output: ["-filter_complex", filter, "-map", "[video]"],
  };
}

function createRenderWorker(parent, frameStart, frameEnd, index) {
  const jobId = `${parent.jobId}-worker-${index + 1}`;
  const segmentPath = path.join(
    parent.temporaryDirectory,
    `segment-${index}.mp4`
  );
  const videoComposite = videoCompositeArguments(parent, frameStart);
  const ffmpeg = spawn(parent.ffmpegBinary, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "bgra",
    "-s",
    `${parent.args.width}x${parent.args.height}`,
    "-framerate",
    String(parent.args.fps),
    "-i",
    "pipe:0",
    ...videoComposite.inputs,
    ...videoComposite.output,
    "-r",
    String(parent.args.fps),
    "-frames:v",
    String(frameEnd - frameStart),
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    parent.encodingPreset,
    "-threads",
    String(parent.encodingThreads),
    "-pix_fmt",
    "yuv420p",
    segmentPath,
  ]);
  const window = new BrowserWindow({
    width: parent.args.width,
    height: parent.args.height + stampHeight,
    // The renderer uses viewport-relative positions. Its content area must be
    // exactly the export size plus the frame stamp outside the video area.
    useContentSize: true,
    frame: false,
    transparent: Boolean(parent.videoBackground),
    backgroundColor: parent.videoBackground ? "#00000000" : "#0b1732",
    show: false,
    focusable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      offscreen: true,
      backgroundThrottling: false,
      additionalArguments: [`--karaokai-render-job=${jobId}`],
    },
  });
  const worker = {
    jobId,
    parent,
    project: parent.project,
    args: parent.args,
    window,
    ffmpeg,
    segmentPath,
    frame: frameStart,
    frameStart,
    frameEnd,
    totalFrames: frameEnd - frameStart,
    ready: false,
    cancelled: false,
    finished: false,
    encoderFailure: null,
    ffmpegError: "",
    awaitingFrame: null,
    frameTimeout: null,
  };
  let ffmpegError = "";
  ffmpeg.stderr.on("data", (chunk) => {
    ffmpegError = `${ffmpegError}${chunk}`.slice(-16_384);
    worker.ffmpegError = ffmpegError;
  });
  renderJobs.set(jobId, worker);
  window.webContents.setFrameRate(RENDER_FRAME_RATE);
  window.webContents.on("paint", (_event, _dirty, image) => {
    if (
      !worker.ready ||
      worker.finished ||
      worker.cancelled ||
      worker.awaitingFrame !== null ||
      worker.frame >= worker.frameEnd
    )
      return;
    try {
      const bitmap = frameBitmap(image, worker.args, worker.frame);
      if (!bitmap) return;
      clearTimeout(worker.frameTimeout);
      worker.awaitingFrame = worker.frame;
      void encodeRenderFrame(worker, worker.frame, bitmap);
    } catch (error) {
      failRenderJob(
        parent,
        error instanceof Error ? error.message : String(error)
      );
    }
  });
  window.webContents.once("did-fail-load", (_event, _code, description) =>
    failRenderJob(parent, `Worker ${index + 1} failed to load: ${description}`)
  );
  ffmpeg.once("error", (error) => failRenderJob(parent, error.message));
  ffmpeg.stdin.on("error", (error) =>
    stopRenderForEncoderFailure(
      worker,
      `Unable to write frame ${worker.frame}: ${error.message}`
    )
  );
  ffmpeg.once("close", (code, signal) => {
    clearTimeout(worker.frameTimeout);
    if (worker.finished) return;
    worker.finished = true;
    renderJobs.delete(worker.jobId);
    if (worker.encoderFailure || code !== 0)
      return failRenderJob(
        parent,
        `Worker ${index + 1} failed. ${ffmpegFailureMessage(worker, code, signal)}`
      );
    if (!window.isDestroyed()) window.destroy();
    parent.completedWorkers += 1;
    if (parent.completedWorkers === parent.workers.length)
      void finalizeRender(parent);
  });
  if (app.isPackaged) void window.loadFile(renderUrl());
  else void window.loadURL(renderUrl());
  return worker;
}

async function finalizeRender(parent) {
  if (parent.finished || parent.cancelled) return;
  try {
    const concatFile = path.join(parent.temporaryDirectory, "segments.txt");
    await fs.promises.writeFile(
      concatFile,
      parent.workers
        .map(
          (worker) => `file '${worker.segmentPath.replace(/'/g, "'\\\\''")}'`
        )
        .join("\n")
    );
    const { audioInputs, filter } = audioArguments(
      parent.instrumental,
      parent.vocals,
      parent.args
    );
    const finalizer = runFfmpeg(parent.ffmpegBinary, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatFile,
      ...audioInputs,
      "-filter_complex",
      filter,
      "-map",
      "0:v",
      "-map",
      "[audio]",
      "-t",
      String(parent.project.duration / 1000),
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      parent.partialPath,
    ]);
    parent.finalizer = finalizer.process;
    await finalizer.completion;
    parent.finalizer = null;
    if (parent.cancelled) return;
    await fs.promises.rename(parent.partialPath, parent.outputPath);
    parent.finished = true;
    emit("project-render-progress", {
      jobId: parent.jobId,
      status: "completed",
      progress: 100,
      outputPath: parent.outputPath,
    });
  } catch (error) {
    failRenderJob(
      parent,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await fs.promises.rm(parent.temporaryDirectory, {
      recursive: true,
      force: true,
    });
    renderJobs.delete(parent.jobId);
  }
}

async function startProjectRender(args) {
  if (renderJobs.size > 0) throw new Error("A video export is already running");
  const project = await projects.loadProject(
    dataRoot(args.storageDirectory),
    args.projectId
  );
  const jobId = `render-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (!project || project.duration <= 0)
    throw new Error("This project has no renderable duration");
  const outputPath = args.outputPath;
  const partialPath = `${outputPath}.part.mp4`;
  const temporaryDirectory = `${outputPath}.parts-${jobId}`;
  const root = dataRoot(args.storageDirectory);
  const directory = projects.projectRoot(root, args.projectId);
  const instrumental = path.join(directory, "audio", "instrumental.wav");
  const vocals = path.join(directory, "audio", "vocals.wav");
  const hasInstrumental = fs.existsSync(instrumental);
  const hasVocals = fs.existsSync(vocals);
  if (!hasInstrumental && !hasVocals)
    throw new Error("No audio stems are available for export");
  const totalFrames = Math.ceil((project.duration / 1000) * args.fps);
  const videoBackground = projectVideoBackground(project, directory);
  const ffmpegBinary = projects.ffmpegBinary(root);
  if (videoBackground)
    videoBackground.duration = await probeVideoDuration(
      ffmpegBinary,
      videoBackground.path
    );
  const encodingPreset = X264_PRESETS.has(args.encodingPreset)
    ? args.encodingPreset
    : "veryfast";
  const job = {
    jobId,
    project,
    args,
    partialPath,
    outputPath,
    totalFrames,
    cancelled: false,
    finished: false,
    temporaryDirectory,
    workers: [],
    completedWorkers: 0,
    encodingThreads: 0,
    encodingPreset,
    ffmpegBinary,
    instrumental: hasInstrumental ? instrumental : null,
    vocals: hasVocals ? vocals : null,
    videoBackground,
  };
  renderJobs.set(jobId, job);
  await fs.promises.mkdir(temporaryDirectory, { recursive: true });
  job.workers.push(createRenderWorker(job, 0, job.totalFrames, 0));
  return jobId;
}

function requestRenderFrame(job) {
  if (job.cancelled || job.finished) return;
  if (job.frame >= job.frameEnd) {
    job.ffmpeg.stdin.end();
    return;
  }
  job.frameTimeout = setTimeout(() => {
    if (!job.finished && !job.cancelled)
      failRenderJob(
        job.parent,
        `Timed out waiting for render frame ${job.frame}`
      );
  }, 30_000);
  job.window.webContents.send("karaokai:event:render-frame", {
    jobId: job.jobId,
    frame: job.frame,
    time: (job.frame / job.args.fps) * 1000,
  });
}

async function encodeRenderFrame(job, frame, bitmap) {
  try {
    await new Promise((resolve, reject) => {
      job.ffmpeg.stdin.write(bitmap, (error) =>
        error ? reject(error) : resolve()
      );
    });
    if (job.finished || frame !== job.frame) return;
    job.awaitingFrame = null;
    job.frame += 1;
    const completedFrames = job.parent.workers.reduce(
      (total, worker) => total + worker.frame - worker.frameStart,
      0
    );
    emit("project-render-progress", {
      jobId: job.parent.jobId,
      status: "rendering",
      progress: Math.round((completedFrames / job.parent.totalFrames) * 100),
    });
    requestRenderFrame(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error && typeof error === "object" && error.code === "EPIPE")
      stopRenderForEncoderFailure(
        job,
        `Unable to write frame ${frame}: ${message}`
      );
    else failRenderJob(job.parent, message);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: "#10101a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      devTools: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.once("ready-to-show", () => window.show());
  window.webContents.on("did-finish-load", () => {
    if (!app.isPackaged) window.webContents.openDevTools({ mode: "detach" });
  });
  window.webContents.on("before-input-event", (event, input) => {
    const toggleDevTools =
      input.type === "keyDown" &&
      (input.key === "F12" ||
        ((input.control || input.meta) && input.shift && input.key === "I"));

    if (toggleDevTools) {
      event.preventDefault();
      window.webContents.toggleDevTools();
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url.startsWith("file:")
      : url.startsWith("http://127.0.0.1:1420") ||
        url.startsWith("http://localhost:1420");
    if (!allowed) event.preventDefault();
  });
  if (app.isPackaged) {
    void window.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    void window.loadURL("http://127.0.0.1:1420");
  }
}

ipcMain.handle("karaokai:invoke", async (_event, command, args = {}) => {
  if (command === "import_font_file") {
    const sourcePath = String(args.sourcePath ?? "");
    const extension = path.extname(sourcePath).toLowerCase();
    if (!new Set([".ttf", ".otf", ".woff", ".woff2"]).has(extension)) {
      throw new Error("Unsupported font file.");
    }
    const source = await fs.promises.stat(sourcePath);
    if (!source.isFile() || source.size > 25 * 1024 * 1024) {
      throw new Error("Font files must be smaller than 25 MB.");
    }
    const fontsDirectory = path.join(dataRoot(args.storageDirectory), "fonts");
    await fs.promises.mkdir(fontsDirectory, { recursive: true });
    const destination = path.join(
      fontsDirectory,
      `${randomUUID()}${extension}`
    );
    await fs.promises.copyFile(sourcePath, destination);
    return destination;
  }
  if (command === "remove_font_file") {
    const fontsDirectory = path.resolve(
      dataRoot(args.storageDirectory),
      "fonts"
    );
    const fontPath = path.resolve(String(args.path ?? ""));
    if (
      fontPath.startsWith(`${fontsDirectory}${path.sep}`) &&
      [".ttf", ".otf", ".woff", ".woff2"].includes(
        path.extname(fontPath).toLowerCase()
      )
    ) {
      await fs.promises.rm(fontPath, { force: true });
    }
    return null;
  }
  if (command === "read_font_file") {
    const filePath = String(args.path ?? "");
    const extension = path.extname(filePath).toLowerCase();
    if (!new Set([".ttf", ".otf", ".woff", ".woff2"]).has(extension)) {
      throw new Error("Unsupported font file.");
    }
    const font = await fs.promises.readFile(filePath);
    if (font.byteLength > 25 * 1024 * 1024) {
      throw new Error("Font files must be smaller than 25 MB.");
    }
    return Array.from(font);
  }
  if (command === "start_project_render") return startProjectRender(args);
  if (command === "cancel_project_render") {
    const job = renderJobs.get(args.jobId);
    if (!job) return null;
    job.cancelled = true;
    job.finished = true;
    for (const worker of job.workers ?? [job]) {
      worker.finished = true;
      clearTimeout(worker.frameTimeout);
      worker.ffmpeg.stdin.destroy();
      worker.ffmpeg.kill();
      if (!worker.window.isDestroyed()) worker.window.destroy();
      renderJobs.delete(worker.jobId);
    }
    job.finalizer?.kill();
    await fs.promises.rm(job.partialPath, { force: true });
    await fs.promises.rm(job.temporaryDirectory, {
      recursive: true,
      force: true,
    });
    renderJobs.delete(args.jobId);
    return null;
  }
  if (command === "render_job_data") {
    const job = renderJobs.get(args.jobId);
    return job
      ? {
          project: job.project,
          storageDirectory: job.args.storageDirectory,
          videoCompositedByEncoder: Boolean(
            (job.parent ?? job).videoBackground
          ),
        }
      : null;
  }
  if (PROJECT_COMMANDS.has(command))
    return projects.run(command, args, nativeContext());
  const result = await runtime.run(command, args, nativeContext());
  if (result !== undefined) return result;
  throw new Error(`Unknown native command: ${command}`);
});
ipcMain.on("karaokai:render-ready", (_event, jobId) => {
  const job = renderJobs.get(jobId);
  if (job && !job.ready) {
    job.ready = true;
    setImmediate(() => requestRenderFrame(job));
  }
});

ipcMain.handle("karaokai:dialog:media", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Audio or video",
        extensions: [
          "mp3",
          "wav",
          "flac",
          "m4a",
          "aac",
          "ogg",
          "mp4",
          "mov",
          "webm",
          "mkv",
        ],
      },
    ],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle("karaokai:dialog:background", async (_event, kind) => {
  const extensions =
    kind === "video"
      ? ["mp4", "mov", "webm", "mkv"]
      : ["png", "jpg", "jpeg", "webp", "gif"];
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: kind === "video" ? "Video" : "Image", extensions }],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle("karaokai:dialog:font", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Font files", extensions: ["ttf", "otf", "woff", "woff2"] },
    ],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle("karaokai:dialog:directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});
ipcMain.handle(
  "karaokai:dialog:video-destination",
  async (_event, defaultPath) => {
    const result = await dialog.showSaveDialog({
      defaultPath: String(defaultPath),
      filters: [{ name: "MP4 video", extensions: ["mp4"] }],
    });
    return result.canceled ? null : (result.filePath ?? null);
  }
);

ipcMain.handle("karaokai:window", (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return null;
  if (action === "minimize") window.minimize();
  if (action === "maximize")
    window.isMaximized() ? window.unmaximize() : window.maximize();
  if (action === "close") window.close();
  return null;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
