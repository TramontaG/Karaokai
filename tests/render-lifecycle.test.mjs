import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(new URL("../electron/main.cjs", import.meta.url));
const source = readFileSync(
  new URL("../electron/main.cjs", import.meta.url),
  "utf8"
);

function harness() {
  const windows = [];
  class Window extends EventEmitter {
    constructor() {
      super();
      windows.push(this);
      this.destroyed = false;
      this.messages = [];
      this.webContents = Object.assign(new EventEmitter(), {
        isDestroyed: () => this.destroyed,
        isCrashed: () => false,
        isLoadingMainFrame: () => false,
        mainFrame: {
          detached: false,
          send: (...args) => this.messages.push(args),
        },
        setFrameRate() {},
        setWindowOpenHandler() {},
        reload: () => {
          this.reloads = (this.reloads ?? 0) + 1;
        },
      });
    }
    isDestroyed() {
      return this.destroyed;
    }
    destroy() {
      this.destroyed = true;
      this.emit("closed");
    }
    loadURL() {
      return Promise.resolve();
    }
  }
  const app = Object.assign(new EventEmitter(), {
    commandLine: { appendSwitch() {} },
    whenReady: () => ({ then() {} }),
  });
  const spawn = () =>
    Object.assign(new EventEmitter(), {
      stdin: Object.assign(new EventEmitter(), {
        destroy() {},
        end() {},
        write(_data, callback) {
          callback();
        },
      }),
      stderr: new EventEmitter(),
      kill() {
        this.killed = true;
      },
    });
  const context = vm.createContext({
    require: (id) => {
      if (id === "electron")
        return {
          app,
          BrowserWindow: Window,
          ipcMain: { handle() {}, on() {} },
        };
      if (id === "node:child_process") return { spawn };
      if (id === "node:fs") return { promises: { rm: async () => {} } };
      return require(id);
    },
    __dirname: new URL("../electron", import.meta.url).pathname,
    process,
    console: { error() {} },
    Buffer,
    setTimeout,
    clearTimeout,
    setImmediate,
  });
  vm.runInContext(source, context);
  const run = (code) => vm.runInContext(code, context);
  const parent = {
    jobId: "test",
    args: { width: 640, height: 360, fps: 30 },
    temporaryDirectory: "/tmp/render-lifecycle-fixture",
    partialPath: "/tmp/render-lifecycle-fixture.part.mp4",
    workers: [],
    completedWorkers: 0,
    totalFrames: 100,
    ffmpegBinary: "ffmpeg",
  };
  context.parent = parent;
  run(
    "renderJobs.set(parent.jobId, parent); parent.workers.push(createRenderWorker(parent, 0, 100, 0));"
  );
  return { run, parent, worker: parent.workers[0], windows, app };
}

test("progress only reaches available application frames, never export workers", () => {
  const h = harness();
  h.run("createWindow(); createWindow();");
  const [, unavailable, healthy] = h.windows;
  for (const state of ["crashed", "loading", "detached", "disposed"]) {
    unavailable.webContents.isCrashed = () => state === "crashed";
    unavailable.webContents.isLoadingMainFrame = () => state === "loading";
    unavailable.webContents.mainFrame.detached = state === "detached";
    unavailable.webContents.mainFrame.send = () => {
      throw new Error("disposed");
    };
    h.run('emit("project-render-progress", { progress: 11 });');
  }
  assert.equal(healthy.messages.length, 4);
  assert.equal(h.worker.window.messages.length, 0);
});

for (const failure of ["crash", "close", "unavailable", "quit"]) {
  test(`export releases encoder and worker on ${failure}`, () => {
    const h = harness();
    if (failure === "crash")
      h.worker.window.webContents.emit(
        "render-process-gone",
        {},
        { reason: "crashed", exitCode: 1 }
      );
    if (failure === "close") h.worker.window.destroy();
    if (failure === "unavailable") {
      h.worker.window.webContents.mainFrame.detached = true;
      h.run("requestRenderFrame(parent.workers[0]);");
    }
    if (failure === "quit") h.app.emit("before-quit");
    assert.equal(h.parent.finished, true);
    assert.equal(h.worker.ffmpeg.killed, true);
    assert.equal(h.worker.window.isDestroyed(), true);
    assert.equal(h.run("renderJobs.size"), 0);
  });
}

test("closing the last application window cancels hidden export workers", () => {
  const h = harness();
  h.run("createWindow();");
  h.windows[1].destroy();
  assert.equal(h.worker.ffmpeg.killed, true);
  assert.equal(h.run("renderJobs.size"), 0);
});

test("application crash stops export and attempts recovery only once", () => {
  const h = harness();
  h.run("createWindow();");
  const window = h.windows[1];
  window.webContents.emit(
    "render-process-gone",
    {},
    { reason: "crashed", exitCode: 1 }
  );
  window.webContents.emit(
    "render-process-gone",
    {},
    { reason: "crashed", exitCode: 1 }
  );
  assert.equal(h.worker.ffmpeg.killed, true);
  assert.equal(window.reloads, 1);
});

test("identical progress percentages do not flood application IPC", async () => {
  const h = harness();
  h.run("createWindow(); parent.totalFrames = 10000;");
  for (let frame = 0; frame < 3; frame++) {
    clearTimeout(h.worker.frameTimeout);
    await h.run(
      `encodeRenderFrame(parent.workers[0], ${frame}, Buffer.alloc(4));`
    );
  }
  assert.equal(h.windows[1].messages.length, 1);
  h.run('stopActiveRenders("test complete");');
});
