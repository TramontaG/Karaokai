const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const tar = require("tar");
const { pythonBinary, ffmpegBinary } = require("./projects.cjs");

const UV_VERSION = "0.12.9";
const PYTHON_VERSION = "3.11.16";
const WORKER_VERSION = "0.4.11";
const WORKER_FINGERPRINT_FILE = "worker-source.sha256";
const WORKER_COPY_FILTER = (source) => !source.split(path.sep).some(
  (part) =>
    ["build", "__pycache__", ".pytest_cache", ".mypy_cache"].includes(part) ||
    part.endsWith(".egg-info")
);
const WHISPER_FILES = [
  "config.json",
  "model.bin",
  "tokenizer.json",
  "vocabulary.txt",
];
const MODELS = [
  [
    "whisper-tiny",
    "Whisper Tiny",
    "~78 MB",
    "Systran/faster-whisper-tiny",
    "d90ca5fe260221311c53c58e660288d3deb8d356",
  ],
  [
    "whisper-base",
    "Whisper Base",
    "~145 MB",
    "Systran/faster-whisper-base",
    "ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66",
  ],
  [
    "whisper-small",
    "Whisper Small",
    "~465 MB",
    "Systran/faster-whisper-small",
    "536b0662742c02347bc0e980a01041f333bce120",
  ],
  [
    "whisper-medium",
    "Whisper Medium",
    "~1.5 GB",
    "Systran/faster-whisper-medium",
    "08e178d48790749d25932bbc082711ddcfdfbc4f",
  ],
  [
    "whisper-large-v3",
    "Whisper Large v3",
    "~3.1 GB",
    "Systran/faster-whisper-large-v3",
    "edaa852ec7e145841d8ffdb056a99866b5f0a478",
  ],
].map(([id, name, sizeLabel, repository, revision]) => ({
  id,
  name,
  sizeLabel,
  repository,
  revision,
  kind: "whisper",
  category: "Speech Recognition",
  files:
    id === "whisper-large-v3"
      ? [
          "config.json",
          "model.bin",
          "preprocessor_config.json",
          "tokenizer.json",
          "vocabulary.json",
        ]
      : WHISPER_FILES,
}));
const DEMUCS_MODELS = [
  {
    id: "demucs-htdemucs",
    name: "HTDemucs",
    model: "htdemucs",
    sizeLabel: "~80 MB",
  },
  {
    id: "demucs-htdemucs-ft",
    name: "HTDemucs Fine-tuned",
    model: "htdemucs_ft",
    sizeLabel: "~320 MB",
  },
  {
    id: "demucs-mdx-extra",
    name: "MDX Extra",
    model: "mdx_extra",
    sizeLabel: "~160 MB",
  },
].map((model) => ({ ...model, kind: "demucs", category: "Stem Separation" }));

function uvBinary(dataRoot) {
  return path.join(
    dataRoot,
    "runtime",
    "tools",
    process.platform === "win32" ? "uv.exe" : "uv"
  );
}

function commandWorks(command, args = ["--version"], options = {}) {
  return spawnSync(command, args, { ...options, stdio: "ignore" }).status === 0;
}

function commandWorksAsync(command, args = ["--version"], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, stdio: "ignore" });
    child.once("error", () => resolve(false));
    child.once("close", (code) => resolve(code === 0));
  });
}

async function workerSourceFingerprint(workerSource) {
  const files = [];
  async function collect(directory) {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (!WORKER_COPY_FILTER(target)) continue;
      if (entry.isDirectory()) await collect(target);
      else if (entry.isFile()) files.push(path.relative(workerSource, target));
    }
  }
  await collect(workerSource);
  const hash = crypto.createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file);
    hash.update("\0");
    hash.update(await fs.promises.readFile(path.join(workerSource, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function synchronizeWorkerSource(dataRoot, appPath) {
  const source = path.join(appPath, "worker");
  const destination = path.join(dataRoot, "runtime", "worker-source");
  const runtimeDirectory = path.dirname(destination);
  const sourceFingerprint = await workerSourceFingerprint(source);
  const fingerprintFile = path.join(runtimeDirectory, WORKER_FINGERPRINT_FILE);
  const previousFingerprint = await fs.promises.readFile(fingerprintFile, "utf8").catch(() => "");
  if (previousFingerprint.trim() === sourceFingerprint && fs.existsSync(destination)) {
    return { directory: destination, fingerprint: sourceFingerprint, changed: false };
  }
  const temporary = `${destination}.${process.pid}-${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.mkdir(runtimeDirectory, { recursive: true });
  await fs.promises.rm(temporary, { recursive: true, force: true });
  await fs.promises.cp(source, temporary, { recursive: true, filter: WORKER_COPY_FILTER });
  await fs.promises.rm(destination, { recursive: true, force: true });
  await fs.promises.rename(temporary, destination);
  await fs.promises.writeFile(fingerprintFile, sourceFingerprint, "utf8");
  return { directory: destination, fingerprint: sourceFingerprint, changed: true };
}

async function installedWorkerMatchesSource(dataRoot, appPath) {
  try {
    const source = await synchronizeWorkerSource(dataRoot, appPath);
    const installed = await fs.promises.readFile(
      path.join(dataRoot, "runtime", "worker-installed.sha256"),
      "utf8"
    );
    return installed.trim() === source.fingerprint;
  } catch {
    return false;
  }
}

async function workerVersionMatches(dataRoot, appPath) {
  try {
    const output = await runCommand(
      pythonBinary(dataRoot),
      ["-m", "karaoke_worker", "--healthcheck"],
      { env: runtimeEnvironment(dataRoot) }
    );
    const report = JSON.parse(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("{"))
        .at(-1) ?? ""
    );
    return report.workerVersion === WORKER_VERSION && await installedWorkerMatchesSource(dataRoot, appPath);
  } catch {
    return false;
  }
}

function runtimeEnvironment(dataRoot) {
  return {
    ...process.env,
    HF_HOME: path.join(dataRoot, "cache", "huggingface"),
    MPLCONFIGDIR: path.join(dataRoot, "cache", "matplotlib"),
    PYTHONNOUSERSITE: "1",
    TORCH_HOME: path.join(dataRoot, "models", "demucs"),
    UV_CACHE_DIR: path.join(dataRoot, "cache", "uv"),
    UV_PYTHON_INSTALL_DIR: path.join(dataRoot, "runtime", "python"),
    UV_PYTHON_INSTALL_BIN: "0",
    UV_PYTHON_INSTALL_REGISTRY: "0",
    UV_MANAGED_PYTHON: "1",
    UV_NO_CONFIG: "1",
    UV_NO_PROGRESS: "1",
    XDG_CACHE_HOME: path.join(dataRoot, "cache", "python"),
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let output = "";
    let errorOutput = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve(output.trim());
      else
        reject(
          new Error(
            errorOutput.trim() ||
              output.trim() ||
              `${command} exited with ${code}`
          )
        );
    });
  });
}

function emitProgress(emit, payload) {
  emit("runtime-install-progress", {
    jobId: payload.jobId,
    componentId: payload.componentId,
    stage: payload.stage,
    progress: payload.progress,
    completedBytes: payload.completedBytes ?? 0,
    totalBytes: payload.totalBytes ?? null,
    message: payload.message ?? payload.componentId,
    error: payload.error ?? null,
  });
}

function uvAsset() {
  const key = `${process.platform}-${process.arch}`;
  const assets = {
    "linux-x64": [
      "uv-x86_64-unknown-linux-gnu.tar.gz",
      "ec7a99cd05e0cd7f80243f135ce1361c76835cb0ee60055d14d20eba8eba1460",
    ],
    "linux-arm64": [
      "uv-aarch64-unknown-linux-gnu.tar.gz",
      "c36fe17937ff6bd16dc42fc13854b5465999fcab2efe0af559381e945e3c6001",
    ],
    "darwin-x64": [
      "uv-x86_64-apple-darwin.tar.gz",
      "e1ca175824f1056589ce9908f7631879ebc3c36535b5e63dc06510beb370b4c1",
    ],
    "darwin-arm64": [
      "uv-aarch64-apple-darwin.tar.gz",
      "301f72afaf54060f92da7016cb0115bd077f43a9c8e39c1d8170a0bac80fd398",
    ],
    "win32-x64": [
      "uv-x86_64-pc-windows-msvc.zip",
      "ddbfcee1ac615a0499f6aa97b5ec8ebdf3ee4a7714a48055ec2ba0030e3cf810",
    ],
    "win32-arm64": [
      "uv-aarch64-pc-windows-msvc.zip",
      "d3360363a3cb671f2c854f4ef48cf4a57fe8664f8ec6a248076d68b797a8acc0",
    ],
  };
  const asset = assets[key];
  if (!asset) throw new Error(`Unsupported runtime platform: ${key}`);
  return { file: asset[0], sha256: asset[1] };
}

async function download(url, destination, onProgress) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body)
    throw new Error(`Download failed with HTTP ${response.status}`);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.part`;
  const file = fs.createWriteStream(temporary);
  const writeError = new Promise((_, reject) => file.once("error", reject));
  const total = Number(response.headers.get("content-length")) || null;
  let completed = 0;
  for await (const chunk of response.body) {
    completed += chunk.length;
    if (!file.write(chunk))
      await new Promise((resolve) => file.once("drain", resolve));
    onProgress?.(completed, total);
  }
  await Promise.race([new Promise((resolve) => file.end(resolve)), writeError]);
  await fs.promises.rename(temporary, destination);
}

async function sha256(file) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function findFile(directory, names) {
  for (const entry of await fs.promises.readdir(directory, {
    withFileTypes: true,
  })) {
    const target = path.join(directory, entry.name);
    if (entry.isFile() && names.includes(entry.name)) return target;
    if (entry.isDirectory()) {
      const found = await findFile(target, names);
      if (found) return found;
    }
  }
  return null;
}

async function ensureUv(dataRoot, emit, jobId) {
  const installed = uvBinary(dataRoot);
  if (commandWorks(installed)) return installed;
  const asset = uvAsset();
  const archive = path.join(dataRoot, "cache", "downloads", asset.file);
  if (!fs.existsSync(archive) || (await sha256(archive)) !== asset.sha256) {
    await download(
      `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${asset.file}`,
      archive,
      (completedBytes, totalBytes) =>
        emitProgress(emit, {
          jobId,
          componentId: "uv",
          stage: "downloading",
          progress: totalBytes ? 2 + (completedBytes / totalBytes) * 5 : 3,
          completedBytes,
          totalBytes,
        })
    );
  }
  if ((await sha256(archive)) !== asset.sha256)
    throw new Error("The uv download failed validation");
  const staging = path.join(dataRoot, "cache", "staging", "uv");
  await fs.promises.rm(staging, { recursive: true, force: true });
  await fs.promises.mkdir(staging, { recursive: true });
  if (asset.file.endsWith(".zip")) {
    await runCommand("tar.exe", ["-xf", archive, "-C", staging]);
  } else {
    await tar.x({ file: archive, cwd: staging });
  }
  const source = await findFile(staging, ["uv", "uv.exe"]);
  if (!source) throw new Error("The official uv archive does not contain uv");
  await fs.promises.mkdir(path.dirname(installed), { recursive: true });
  await fs.promises.copyFile(source, installed);
  if (process.platform !== "win32") await fs.promises.chmod(installed, 0o755);
  return installed;
}

async function installWhisperModel(
  dataRoot,
  model,
  emit,
  jobId,
  from = 86,
  to = 99
) {
  const directory = path.join(dataRoot, "models", "whisper", model.id);
  await fs.promises.mkdir(directory, { recursive: true });
  for (let index = 0; index < model.files.length; index += 1) {
    const file = model.files[index];
    const destination = path.join(directory, file);
    if (
      fs.existsSync(destination) &&
      (await fs.promises.stat(destination)).size > 0
    )
      continue;
    await download(
      `https://huggingface.co/${model.repository}/resolve/${model.revision}/${file}?download=true`,
      destination,
      (completedBytes, totalBytes) => {
        const fileProgress = totalBytes ? completedBytes / totalBytes : 0.5;
        emitProgress(emit, {
          jobId,
          componentId: model.id,
          stage: "downloading",
          progress:
            from + (to - from) * ((index + fileProgress) / model.files.length),
          completedBytes,
          totalBytes,
        });
      }
    );
  }
}

async function ensureRuntime(dataRoot, model, emit, appPath) {
  const jobId = "runtime-bootstrap";
  const progress = (componentId, value, message = componentId) =>
    emitProgress(emit, {
      jobId,
      componentId,
      stage: "installing",
      progress: value,
      message,
    });
  const existingComponents = await runtimeComponents(dataRoot, appPath);
  const runtimeReady = existingComponents.every(
    (component) => component.verified
  );
  const defaultDemucs = DEMUCS_MODELS[0];
  if (
    runtimeReady &&
    modelInstalled(dataRoot, defaultDemucs) &&
    modelInstalled(dataRoot, model)
  ) {
    emitProgress(emit, {
      jobId,
      componentId: "runtime",
      stage: "completed",
      progress: 100,
      message: "Runtime ready",
    });
    return;
  }
  const uv = await ensureUv(dataRoot, emit, jobId);
  const env = runtimeEnvironment(dataRoot);
  progress("python", 9);
  await runCommand(
    uv,
    [
      "python",
      "install",
      PYTHON_VERSION,
      "--install-dir",
      env.UV_PYTHON_INSTALL_DIR,
      "--managed-python",
      "--no-bin",
      "--no-config",
    ],
    { env }
  );
  const python = pythonBinary(dataRoot);
  if (!commandWorks(python)) {
    await runCommand(
      uv,
      [
        "venv",
        path.join(dataRoot, "runtime", "python-environment"),
        "--python",
        PYTHON_VERSION,
        "--managed-python",
        "--no-config",
      ],
      { env }
    );
  }
  progress("ml-worker", 28);
  const workerSource = await synchronizeWorkerSource(dataRoot, appPath);
  const cuda = commandWorks("nvidia-smi", ["-L"]);
  const torchIndex = cuda
    ? "https://download.pytorch.org/whl/cu124"
    : "https://download.pytorch.org/whl/cpu";
  await runCommand(
    uv,
    [
      "pip",
      "install",
      "--python",
      python,
      "--reinstall",
      workerSource.directory,
      "--extra-index-url",
      torchIndex,
      "--index-strategy",
      "unsafe-best-match",
    ],
    { env }
  );
  await fs.promises.writeFile(
    path.join(dataRoot, "runtime", "worker-installed.sha256"),
    workerSource.fingerprint,
    "utf8"
  );
  progress("ffmpeg", 64);
  await runCommand(
    uv,
    [
      "pip",
      "install",
      "--python",
      python,
      "imageio-ffmpeg==0.6.0",
      "yt-dlp==2026.8.19",
    ],
    { env }
  );
  const bundledFfmpeg = await runCommand(
    python,
    ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
    { env }
  );
  const ffmpeg = ffmpegBinary(dataRoot);
  await fs.promises.mkdir(path.dirname(ffmpeg), { recursive: true });
  await fs.promises.copyFile(bundledFfmpeg.trim(), ffmpeg);
  if (process.platform !== "win32") await fs.promises.chmod(ffmpeg, 0o755);
  progress("demucs-htdemucs", 78);
  const demucsHome = path.join(dataRoot, "models", "demucs", "demucs-htdemucs");
  await fs.promises.mkdir(demucsHome, { recursive: true });
  await runCommand(
    python,
    ["-c", "from demucs.pretrained import get_model; get_model('htdemucs')"],
    {
      env: { ...env, TORCH_HOME: demucsHome },
    }
  );
  const marker = path.join(
    dataRoot,
    "models",
    "demucs",
    "installed",
    "demucs-htdemucs.json"
  );
  await fs.promises.mkdir(path.dirname(marker), { recursive: true });
  await fs.promises.writeFile(
    marker,
    JSON.stringify({ id: "demucs-htdemucs", model: "htdemucs" }, null, 2)
  );
  await installWhisperModel(dataRoot, model, emit, jobId);
  emitProgress(emit, {
    jobId,
    componentId: "runtime",
    stage: "completed",
    progress: 100,
    message: "Runtime ready",
  });
}

function modelInstalled(dataRoot, model) {
  if (model.kind === "demucs") {
    return fs.existsSync(
      path.join(dataRoot, "models", "demucs", "installed", `${model.id}.json`)
    );
  }
  return model.files.every((file) => {
    const target = path.join(dataRoot, "models", "whisper", model.id, file);
    return fs.existsSync(target) && fs.statSync(target).size > 0;
  });
}

async function runtimeComponents(dataRoot, appPath) {
  const python = pythonBinary(dataRoot);
  const [workerReady, ytDlpReady, ffmpegReady] = await Promise.all([
    workerVersionMatches(dataRoot, appPath),
    commandWorksAsync(python, ["-m", "yt_dlp", "--version"], {
      env: runtimeEnvironment(dataRoot),
    }),
    commandWorksAsync(ffmpegBinary(dataRoot), ["-version"]),
  ]);
  return [
    [
      "ffmpeg",
      "FFmpeg",
      "7.0.2",
      ffmpegBinary(dataRoot),
      ffmpegReady,
      "~78 MB",
    ],
    [
      "ml-worker",
      "ML Worker",
      WORKER_VERSION,
      path.dirname(python),
      workerReady,
      "~1.2 GB",
    ],
    [
      "yt-dlp",
      "yt-dlp",
      "2026.8.19",
      path.dirname(python),
      ytDlpReady,
      "~20 MB",
    ],
  ].map(([id, name, version, installPath, verified, sizeLabel]) => ({
    id,
    name,
    installed: verified,
    installedVersion: verified ? version : null,
    availableVersion: version,
    platform: `${process.platform}-${process.arch}`,
    sizeLabel,
    installPath,
    sha256: null,
    verified,
    updateAvailable: false,
  }));
}

async function runtimeComponentInventory(dataRoot, appPath) {
  const python = pythonBinary(dataRoot);
  const [ffmpegReady, workerRuntimeReady, ytDlpReady] = await Promise.all([
    commandWorksAsync(ffmpegBinary(dataRoot), ["-version"]),
    workerVersionMatches(dataRoot, appPath),
    commandWorksAsync(python, ["-m", "yt_dlp", "--version"], {
      env: runtimeEnvironment(dataRoot),
    }),
  ]);
  return [
    [
      "ffmpeg",
      "FFmpeg",
      "7.0.2",
      ffmpegBinary(dataRoot),
      ffmpegReady,
      "~78 MB",
    ],
    [
      "ml-worker",
      "ML Worker",
      WORKER_VERSION,
      path.dirname(python),
      workerRuntimeReady,
      "~1.2 GB",
    ],
    [
      "yt-dlp",
      "yt-dlp",
      "2026.8.19",
      path.dirname(python),
      ytDlpReady,
      "~20 MB",
    ],
  ].map(([id, name, version, installPath, verified, sizeLabel]) => ({
    id,
    name,
    installed: verified,
    installedVersion: verified ? version : null,
    availableVersion: version,
    platform: `${process.platform}-${process.arch}`,
    sizeLabel,
    installPath,
    sha256: null,
    verified,
    updateAvailable: false,
  }));
}

async function run(command, args, context) {
  const dataRoot = context.dataRoot(args.storageDirectory);
  if (command === "bootstrap_app") {
    const directories = [
      "projects",
      "models",
      "cache",
      "config",
      "runtime",
    ].map((name) => path.join(dataRoot, name));
    await Promise.all(
      directories.map((directory) =>
        fs.promises.mkdir(directory, { recursive: true })
      )
    );
    let installedWhisperModelIds = MODELS.filter((model) =>
      modelInstalled(dataRoot, model)
    ).map((model) => model.id);
    let installedDemucsModelIds = DEMUCS_MODELS.filter((model) =>
      modelInstalled(dataRoot, model)
    ).map((model) => model.id);
    let workerReady = await workerVersionMatches(dataRoot, context.appPath);
    if (!workerReady && installedWhisperModelIds.length > 0) {
      const model = MODELS.find((entry) => entry.id === installedWhisperModelIds[0]);
      if (model) {
        await ensureRuntime(dataRoot, model, context.emit, context.appPath);
        workerReady = await workerVersionMatches(dataRoot, context.appPath);
        installedWhisperModelIds = MODELS.filter((entry) =>
          modelInstalled(dataRoot, entry)
        ).map((entry) => entry.id);
        installedDemucsModelIds = DEMUCS_MODELS.filter((entry) =>
          modelInstalled(dataRoot, entry)
        ).map((entry) => entry.id);
      }
    }
    return {
      dataDirectory: dataRoot,
      directories,
      operatingSystem: process.platform,
      architecture: process.arch,
      runtimeProfile: commandWorks("nvidia-smi", ["-L"]) ? "cuda" : "cpu",
      runtimeReady:
        workerReady &&
        fs.existsSync(ffmpegBinary(dataRoot)) &&
        installedWhisperModelIds.length > 0 &&
        installedDemucsModelIds.length > 0,
      installedWhisperModelIds,
      installedDemucsModelIds,
    };
  }
  if (command === "list_models") {
    return [...MODELS, ...DEMUCS_MODELS].map((model) => ({
      id: model.id,
      name: model.name,
      category: model.category,
      kind: model.kind,
      sizeLabel: model.sizeLabel,
      installed: modelInstalled(dataRoot, model),
    }));
  }
  if (command === "start_runtime_install") {
    const model = MODELS.find((entry) => entry.id === args.modelId);
    if (!model) throw new Error(`Unknown Whisper model: ${args.modelId}`);
    void ensureRuntime(dataRoot, model, context.emit, context.appPath).catch(
      (error) => {
        emitProgress(context.emit, {
          jobId: "runtime-bootstrap",
          componentId: "runtime",
          stage: "failed",
          progress: 0,
          message: error.message,
          error: {
            code: "RUNTIME_INSTALL_FAILED",
            stage: "runtime",
            recoverable: true,
            message: error.message,
          },
        });
      }
    );
    return "runtime-bootstrap";
  }
  if (command === "start_model_download") {
    const model = MODELS.find((entry) => entry.id === args.modelId);
    if (!model) throw new Error(`Unsupported model download: ${args.modelId}`);
    const jobId = `model-${model.id}-${Date.now()}`;
    void installWhisperModel(dataRoot, model, context.emit, jobId, 0, 100)
      .then(() =>
        emitProgress(context.emit, {
          jobId,
          componentId: model.id,
          stage: "completed",
          progress: 100,
        })
      )
      .catch((error) =>
        emitProgress(context.emit, {
          jobId,
          componentId: model.id,
          stage: "failed",
          progress: 0,
          message: error.message,
          error: {
            code: "MODEL_DOWNLOAD_FAILED",
            stage: "model",
            recoverable: true,
            message: error.message,
          },
        })
      );
    return jobId;
  }
  if (command === "list_runtime_components")
    return runtimeComponentInventory(dataRoot, context.appPath);
  if (command === "run_runtime_checkup")
    return runtimeComponents(dataRoot, context.appPath);
  if (command === "install_runtime_component") {
    const model =
      MODELS.find((entry) => modelInstalled(dataRoot, entry)) ?? MODELS[0];
    await ensureRuntime(dataRoot, model, context.emit, context.appPath);
    return null;
  }
  if (command === "open_managed_location") {
    const target =
      args.targetKind === "model"
        ? path.join(
            dataRoot,
            "models",
            args.targetId.startsWith("whisper-") ? "whisper" : "demucs"
          )
        : args.targetId === "ffmpeg"
          ? path.dirname(ffmpegBinary(dataRoot))
          : path.join(dataRoot, "runtime");
    await context.shell.openPath(target);
    return null;
  }
  if (command === "remove_model") {
    if (args.modelId.startsWith("whisper-")) {
      await fs.promises.rm(
        path.join(dataRoot, "models", "whisper", args.modelId),
        { recursive: true, force: true }
      );
    } else {
      await fs.promises.rm(
        path.join(
          dataRoot,
          "models",
          "demucs",
          "installed",
          `${args.modelId}.json`
        ),
        { force: true }
      );
    }
    return null;
  }
  if (command === "remove_runtime_component") {
    const target =
      args.componentId === "ffmpeg"
        ? path.dirname(ffmpegBinary(dataRoot))
        : path.join(dataRoot, "runtime", "python-environment");
    await fs.promises.rm(target, { recursive: true, force: true });
    return null;
  }
  if (command === "clear_downloaded_data") {
    await Promise.all(
      ["models", "runtime", "cache"].map((name) =>
        fs.promises.rm(path.join(dataRoot, name), {
          recursive: true,
          force: true,
        })
      )
    );
    return null;
  }
  return undefined;
}

module.exports = { run };
