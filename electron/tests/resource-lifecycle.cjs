const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-resources-"))
);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
app.whenReady().then(async () => {
  const w = new BrowserWindow({
    show: false,
    width: 1400,
    height: 950,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, "fixtures/resource-lifecycle-preload.cjs"),
    },
  });
  const js = (code) => w.webContents.executeJavaScript(code, true);
  try {
    await w.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await wait(1200);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await wait(300);
    await js(`document.querySelector('[role="button"]').click()`);
    await wait(600);
    await js(
      `document.querySelector('svg.lucide-play').closest('button').click()`
    );
    const samples = [];
    for (let i = 0; i < 3; i++) {
      await wait(2000);
      samples.push(
        await js(
          `({rules:Array.from(document.styleSheets).reduce((n,s)=>n+s.cssRules.length,0),time:document.querySelector('audio').currentTime,width:document.querySelector('[data-subtitle-color="readColor"]').getBoundingClientRect().width})`
        )
      );
    }
    console.log(samples);
    assert.ok(samples[2].time > 5, "Playback must run");
    assert.ok(samples[2].width > samples[0].width, "Word fill must animate");
    assert.ok(
      samples[2].rules - samples[0].rules <= 2,
      "Playback must not accumulate CSS rules"
    );
    const cycles = [];
    for (let cycle = 0; cycle < 5; cycle++) {
      // Begin a real drag, then navigate away before pointerup.
      await js(
        `(()=>{const clip=document.querySelector('[data-timeline-phrase]');const rect=clip.getBoundingClientRect();clip.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,button:0,clientX:rect.x+20,clientY:rect.y+10}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:rect.x+40,clientY:rect.y+10}));})()`
      );
      assert.ok(
        (await js("window.resources.pointers.size")) > 0,
        "Exercise active drag listeners"
      );
      await js(`document.querySelector('a[href="/library"]').click()`);
      for (let attempt = 0; attempt < 40; attempt++) {
        if (
          !(await js(
            `Boolean(document.querySelector('[data-timeline-phrase]'))`
          ))
        )
          break;
        await wait(100);
      }
      assert.equal(
        await js(`Boolean(document.querySelector('[data-timeline-phrase]'))`),
        false,
        "Navigation must leave editor"
      );
      await wait(200);
      const resources = await js(
        `({urls:Array.from(window.resources.urls.values()).filter(type=>type.startsWith("audio/")).length,pointers:window.resources.pointers.size,subscriptions:window.resources.subscriptions.size})`
      );
      cycles.push(resources);
      assert.equal(resources.urls, 0, "Leaving editor must revoke media URLs");
      assert.equal(
        resources.pointers,
        0,
        "Leaving during drag must remove pointer listeners"
      );
      assert.deepEqual(
        resources,
        cycles[0],
        "Resources must not accumulate across editor sessions"
      );
      await js(`document.querySelector('[role="button"]').click()`);
      await wait(500);
    }
    console.log({ cycles });
    app.exit(0);
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 30000);
