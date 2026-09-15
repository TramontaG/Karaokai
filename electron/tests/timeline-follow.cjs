// Uses an isolated profile and silent audio to test actual scroll behavior.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-follow-test-"))
);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1400,
    height: 950,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, "fixtures/playback-preload.cjs"),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code, true);
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await wait(1200);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await wait(300);
    await js(`document.querySelector('[role="button"]').click()`);
    await wait(500);
    await js(
      `window.followInput=Array.from(document.querySelectorAll('label')).find(label=>label.textContent.includes('Acompanhar reprodução')).querySelector('input');window.followInput.click();window.followViewport=document.querySelector('[data-time-signature-marker]').parentElement.parentElement;void 0;`
    );
    await wait(100);
    for (let i = 0; i < 30; i++) {
      await js(
        `window.followViewport.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-1,clientX:window.followViewport.getBoundingClientRect().left}))`
      );
    }
    await wait(250);
    await js(
      `(()=>{const input=document.querySelector('input[type="range"][max="180000"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'4000');input.dispatchEvent(new Event('input',{bubbles:true}));window.followViewport.scrollLeft=0;})()`
    );
    await wait(100);
    const sample = (duration) =>
      js(
        `new Promise(resolve=>{const points=[];const start=performance.now();function frame(now){points.push(window.followViewport.scrollLeft);if(now-start>${duration})resolve(points);else requestAnimationFrame(frame);}requestAnimationFrame(frame);})`
      );
    await js(`window.followInput.click()`);
    const activation = await sample(800);
    const activationSteps = activation
      .slice(1)
      .map((point, i) => point - activation[i]);
    assert.ok(activation.at(-1) > 100, "Follow must center a zoomed timeline");
    assert.ok(
      activationSteps.filter((step) => step > 0).length >= 8,
      "Activation must animate over several frames"
    );
    assert.ok(
      Math.max(...activationSteps) < activation.at(-1) * 0.4,
      "Activation must not jump to the target"
    );
    await js(
      `document.querySelector('svg.lucide-play').closest('button').click()`
    );
    await wait(200);
    const playback = await sample(1000);
    const advancing = playback
      .slice(1)
      .filter((point, i) => point > playback[i]).length;
    assert.ok(
      advancing / (playback.length - 1) > 0.8,
      "Continuous follow must advance on most display frames"
    );
    await js(`window.followInput.click()`);
    await wait(50);
    const disabled = await sample(250);
    assert.equal(
      Math.max(...disabled) - Math.min(...disabled),
      0,
      "Disabling follow must stop queued scrolling"
    );
    console.log({
      activationFrames: activation.length,
      activationMovingFrames: activationSteps.filter((step) => step > 0).length,
      playbackFrames: playback.length,
      playbackMovingFrames: advancing,
      disabledScroll: disabled[0],
    });
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
