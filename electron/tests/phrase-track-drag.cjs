// Run after npm run build. Simulates both direct and selected cross-track drags.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-phrase-drag-"))
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
      preload: path.join(__dirname, "fixtures/phrase-track-drag-preload.cjs"),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code, true);
  const phrases = () =>
    js(
      `window.karaokaiDesktop.invoke("load_project").then(project => Object.fromEntries(project.tracks.filter(track => track.type === "subtitle").map(track => [track.id, track.phrases.map(phrase => phrase.id)])))`
    );
  const drag = async (phraseId, sourceId, targetId, selectFirst = false) => {
    await js(`(() => {
      const lane = document.querySelector('div[data-subtitle-track-id="${sourceId}"]');
      const clip = [...lane.querySelectorAll('[data-timeline-phrase]')]
        .find(element => element.textContent.includes('${phraseId === "alpha" ? "Alpha" : "Beta"}'));
      if (!clip) throw new Error('Phrase clip not found');
      if (${selectFirst}) clip.click();
    })()`);
    if (selectFirst) await wait(80);
    await js(`(() => {
      const lane = document.querySelector('div[data-subtitle-track-id="${sourceId}"]');
      const clip = [...lane.querySelectorAll('[data-timeline-phrase]')]
        .find(element => element.textContent.includes('${phraseId === "alpha" ? "Alpha" : "Beta"}'));
      const target = document.querySelector('div[data-subtitle-track-id="${targetId}"]');
      const sourceBounds = clip.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const x = sourceBounds.left + sourceBounds.width / 2;
      const y = sourceBounds.top + sourceBounds.height / 2;
      clip.querySelector('[data-timeline-word-id]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0, clientX: x, clientY: y }));
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: x + 5, clientY: y }));
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: x + 10, clientY: targetBounds.top + targetBounds.height / 2 }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: x + 10, clientY: targetBounds.top + targetBounds.height / 2 }));
    })()`);
    await wait(150);
  };

  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await wait(1200);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await wait(300);
    await js(`document.querySelector('[role="button"]').click()`);
    await wait(600);
    await drag("alpha", "source-track", "target-track");
    assert.deepEqual(await phrases(), {
      "source-track": ["beta"],
      "target-track": ["alpha"],
    });

    // Alpha is selected on the target track; Beta is not selected.
    await drag("beta", "source-track", "target-track");
    assert.deepEqual(await phrases(), {
      "source-track": [],
      "target-track": ["alpha", "beta"],
    });

    await drag("alpha", "target-track", "source-track", true);
    assert.deepEqual(await phrases(), {
      "source-track": ["alpha"],
      "target-track": ["beta"],
    });
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});

setTimeout(() => app.exit(2), 30000);
