// Run after npm run build: electron electron/tests/render-frames.cjs
// Requires a graphical session and ffmpeg on PATH.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");
const { execFileSync } = require("node:child_process");
const bannerMode = process.argv.includes("--banner");
const root = path.resolve(__dirname, "../..");
const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), "karaokai-render-check-")
);
const localRequire = createRequire(path.join(root, "electron/main.cjs"));
const { app, BrowserWindow } = localRequire("electron");
app.setPath("userData", path.join(directory, "profile"));
app.on("window-all-closed", () => {});
const context = vm.createContext({
  require: (id) =>
    id === "./runtime.cjs"
      ? {
          // Export needs no model/runtime setup. Keep the application's bootstrap
          // inside the test directory, away from installed models and user data.
          run: async (command) => {
            if (command === "list_models") return [];
            if (command !== "bootstrap_app")
              throw new Error(`Unexpected runtime command: ${command}`);
            return {
              dataDirectory: directory,
              directories: [],
              operatingSystem: process.platform,
              architecture: process.arch,
              runtimeProfile: "cpu",
              runtimeReady: false,
              installedWhisperModelIds: [],
              installedDemucsModelIds: [],
            };
          },
        }
      : localRequire(id),
  __dirname: path.join(root, "electron"),
  process,
  console,
  Buffer,
  setImmediate,
  setTimeout,
  clearTimeout,
});
const source = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");
// Exercise the production IPC, renderer, capture and FFmpeg pipeline without
// opening the editor or touching the user's projects. Startup, runtime setup
// and job finalization are replaced; inspect the encoded segment directly.
vm.runInContext(
  source.slice(0, source.indexOf("app.whenReady().then(")),
  context
);
context.testRenderUrl = pathToFileURL(path.join(root, "dist/index.html")).href;
vm.runInContext("renderUrl = () => testRenderUrl;", context);
const timeout = setTimeout(() => {
  console.error("Render check timed out");
  app.exit(1);
}, 60000);
(async () => {
  await app.whenReady();
  require("./frame-bitmap.cjs")();
  const backgroundPath = path.join(directory, "background.mp4");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=blue:s=640x360:r=60:d=1",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    backgroundPath,
  ]);
  for (const { width, height, fps, blank = false } of [
    { width: 640, height: 360, fps: 30 },
    { width: 640, height: 360, fps: 60 },
    { width: 1920, height: 1080, fps: 60 },
    { width: 640, height: 360, fps: 30, blank: true },
  ])
    for (const video of [false, true]) {
      const caseDir = path.join(directory, `${width}-${fps}-${video}-${blank}`);
      fs.mkdirSync(caseDir);
      const job = {
        jobId: `test-${width}-${fps}-${video}`,
        args: { width, height, fps },
        project: {
          id: "fixture",
          duration: 1200,
          tracks: [
            {
              id: "background",
              type: "background",
              visible: true,
              preset: video ? "video" : "solid",
              color: "#000000",
            },
            {
              id: "subtitles",
              type: "subtitle",
              visible: true,
              zIndex: 1,
              style: { readColor: "#ff0000", unreadColor: "#ffffff", scale: 1 },
              karaokeMode: bannerMode ? "banner" : "continuity",
              ...(bannerMode
                ? {
                    style: {
                      unreadColor: "#ffffff",
                      currentColor: "#ffffff",
                      readColor: "#ffffff",
                      unreadRectangleColor: "#00ff00",
                      currentRectangleColor: "#ffff00",
                      readRectangleColor: "#ff0000",
                      bannerSpeed: 100,
                    },
                  }
                : {}),
              curve: "linear",
              phrases: [
                {
                  id: "phrase",
                  text: "MMMMMMMMMMMM",
                  start: 0,
                  end: 1200,
                  words: [
                    { id: "word", text: "MMMMMMMMMMMM", start: 200, end: 1000 },
                    ...(bannerMode
                      ? [
                          {
                            id: "next",
                            text: "Overlapping label",
                            start: 1050,
                            end: 1100,
                          },
                          {
                            id: "last",
                            text: "Another word",
                            start: 1100,
                            end: 1200,
                          },
                        ]
                      : []),
                  ],
                },
                ...(bannerMode
                  ? [
                      {
                        id: "after-gap",
                        text: "Next",
                        start: 1800,
                        end: 2100,
                        words: [
                          {
                            id: "next-phrase-word",
                            text: "Next",
                            start: 1800,
                            end: 2100,
                          },
                        ],
                      },
                      {
                        id: "touching",
                        text: "Touching",
                        start: 2100,
                        end: 2500,
                        words: [
                          {
                            id: "touching-word",
                            text: "Touching",
                            start: 2100,
                            end: 2500,
                          },
                        ],
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
        temporaryDirectory: caseDir,
        partialPath: path.join(caseDir, "partial.mp4"),
        workers: [],
        completedWorkers: 0,
        totalFrames: Math.ceil(fps * 1.2),
        encodingPreset: "ultrafast",
        encodingThreads: 1,
        ffmpegBinary: "ffmpeg",
        videoBackground: video
          ? { path: backgroundPath, duration: 1, fit: "cover", color: "000000" }
          : null,
      };
      if (blank)
        job.project.tracks = job.project.tracks.filter(
          (track) => track.type !== "subtitle"
        );
      const started = performance.now();
      await new Promise((resolve, reject) => {
        context.testJob = job;
        context.done = resolve;
        context.failed = reject;
        vm.runInContext(
          `finalizeRender = () => done(); failRenderJob = (_job, error) => failed(new Error(error)); testJob.workers.push(createRenderWorker(testJob, 0, testJob.totalFrames, 0));`,
          context
        );
      });
      const elapsedMs = performance.now() - started;
      const raw = execFileSync(
        "ffmpeg",
        [
          "-v",
          "error",
          "-i",
          path.join(caseDir, "segment-0.mp4"),
          "-f",
          "rawvideo",
          "-pix_fmt",
          "rgb24",
          "pipe:1",
        ],
        { maxBuffer: width * height * 3 * (job.totalFrames + 1) }
      );
      const frameBytes = width * height * 3;
      if (raw.length !== frameBytes * job.totalFrames)
        throw new Error(`Incorrect frame count: ${raw.length / frameBytes}`);
      let previous = -1;
      for (let frame = 0; frame < job.totalFrames; frame++) {
        if (bannerMode && !blank) {
          const time = (frame / fps) * 1000;
          const scale = width / 640;
          const x = Math.round((320 + (200 - time) / 10 + 8) * scale);
          const y = Math.round((167 * height) / 360);
          // The source has no word/phrase in 1200–1800 ms. Banner must fill
          // this short inter-phrase interval with an unread, hatched rectangle.
          const gapX = Math.round((320 + (1500 - time) / 10) * scale);
          const gapY = Math.round((180 * height) / 360);
          const gapPixel = frame * frameBytes + (gapY * width + gapX) * 3;
          const [gapR, gapG, gapB] = raw.subarray(gapPixel, gapPixel + 3);
          if (!(gapG > 170 && gapR < 100 && gapB < 100))
            throw new Error(
              `Missing Banner inter-phrase silence at ${width} frame ${frame}: ${gapR},${gapG},${gapB}`
            );
          // Stay away from the stationary playhead and codec edge ringing.
          if (Math.abs(x - width / 2) > 5 * scale) {
            const pixel = frame * frameBytes + (y * width + x) * 3;
            const [r, g, b] = raw.subarray(pixel, pixel + 3);
            const valid =
              time < 200
                ? g > 180 && r < 80 && b < 80
                : time < 1000
                  ? r > 180 && g > 180 && b < 80
                  : r > 180 && g < 80 && b < 80;
            if (!valid)
              throw new Error(
                `Banner rectangle timing/position mismatch at ${width} frame ${frame}: ${r},${g},${b}`
              );
          }
          continue;
        }
        let redPixels = 0;
        // Inspect the word itself; the entry cue below it animates before
        // the word starts and disappears afterwards.
        const firstPixel =
          frame * frameBytes + Math.floor(height * 0.44) * width * 3;
        const lastPixel =
          frame * frameBytes + Math.floor(height * 0.55) * width * 3;
        for (let p = firstPixel; p < lastPixel; p += 3) {
          if (
            raw[p] > 150 &&
            raw[p] > raw[p + 1] * 2 &&
            raw[p] > raw[p + 2] * 2
          )
            redPixels++;
        }
        const time = (frame / fps) * 1000;
        if ((blank || time <= 200) && redPixels !== 0)
          throw new Error(`Subtitle filled before its start at frame ${frame}`);
        // Before/after the word, identical subtitle pixels are intentional.
        if (!blank && time > 200 && time < 1000 && redPixels <= previous)
          throw new Error(
            `${width}x${height} ${fps}fps video=${video}: frozen/backward fill at frame ${frame}: ${previous} -> ${redPixels}`
          );
        previous = redPixels;
      }
      console.log(
        `PASS ${width}x${height} ${fps}fps video=${video} blank=${blank}: ${job.totalFrames} decoded frames; ${elapsedMs.toFixed(0)}ms export`
      );
    }
  clearTimeout(timeout);
  // The Electron profile may still be open until the process exits.
  console.log(`Test artifacts: ${directory}`);
  app.exit(0);
})().catch((error) => {
  console.error(error);
  for (const window of BrowserWindow.getAllWindows()) window.destroy();
  app.exit(1);
});
