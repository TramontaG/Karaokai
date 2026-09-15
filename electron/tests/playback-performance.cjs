// Run after npm run build: electron electron/tests/playback-performance.cjs
const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const fs = require("node:fs");
app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-playback-probe-"))
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  for (const metronome of [false, true]) {
    const w = new BrowserWindow({
      show: false,
      width: 1400,
      height: 950,
      webPreferences: {
        offscreen: true,
        backgroundThrottling: false,
        contextIsolation: false,
        sandbox: false,
        preload: path.join(__dirname, "fixtures/playback-preload.cjs"),
        additionalArguments: metronome ? ["--test-metronome"] : [],
      },
    });
    const js = (s) => w.webContents.executeJavaScript(s, true);
    try {
      await w.loadFile(path.join(root, "dist/index.html"));
      await wait(1200);
      await js(`document.querySelector('a[href="/library"]').click()`);
      await wait(300);
      await js(`document.querySelector('[role="button"]').click()`);
      await wait(600);
      await js(
        `document.querySelector('svg.lucide-play').closest('button').click()`
      );
      await wait(300);
      await js(
        `window.probe.recording=true;let last=performance.now();function frame(now){if(!window.probe.recording)return;window.probe.frameIntervals.push(now-last);last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);`
      );
      await wait(4000);
      const result = await js(
        `window.probe.recording=false;({...window.probe,audioTime:document.querySelector('audio').currentTime,frameIntervals:undefined,frames:window.probe.frameIntervals.length,maxFrame:Math.max(...window.probe.frameIntervals),longFrames:window.probe.frameIntervals.filter(t=>t>40).length})`
      );
      assert.ok(
        result.audioTime > 3,
        "Playback must advance through the BPM change"
      );
      assert.ok(
        result.frames > 20 && result.commits > 20,
        "The test must exercise playback updates"
      );
      assert.equal(
        result.timelineChanges,
        0,
        "Playback must not invalidate the entire timeline"
      );
      assert.equal(
        result.gridChanges,
        0,
        "Playback must reuse the computed grid"
      );
      console.log({ metronome, ...result });
      w.destroy();
    } catch (e) {
      console.error(e);
      app.exit(1);
      return;
    }
  }
  app.exit(0);
});
app.on("window-all-closed", () => {});
setTimeout(() => app.exit(2), 30000);
