const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-grid-align-test-"))
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
      preload: path.join(
        __dirname,
        "fixtures/grid-phrase-alignment-preload.cjs"
      ),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code, true);
  const phrases = () =>
    js(
      `JSON.parse(localStorage.getItem('signature-test-project')).tracks.find(track=>track.type==='subtitle').phrases`
    );
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await wait(1200);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await wait(300);
    await js(`document.querySelector('[role="button"]').click()`);
    await wait(600);
    const button = `document.querySelector('button[aria-label="Alinhar frases e palavras ao grid"]')`;
    assert.equal(await js(`Boolean(${button})`), true);
    assert.equal(await js(`${button}.disabled`), false);
    await js(`${button}.click()`);
    await wait(450);
    let current = await phrases();
    assert.equal(await js(`${button}.disabled`), true);
    assert.deepEqual(
      current.map(({ start, end }) => [start, end]),
      [
        [1000, 3000],
        [4000, 5000],
      ]
    );
    assert.deepEqual(
      current.map(({ text }) => text),
      ["Hello world", "Again"]
    );
    assert.deepEqual(
      current[0].words
        .filter((word) => word.type !== "gap")
        .map(({ start, end }) => [start, end]),
      [
        [1000, 2000],
        [2000, 3000],
      ]
    );
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}))`
    );
    await wait(450);
    current = await phrases();
    assert.deepEqual(
      current.map(({ start, end }) => [start, end]),
      [
        [1050, 2950],
        [4100, 4820],
      ]
    );
    console.log("PASS: align phrases and words to grid, preserve text, undo");
    app.exit(0);
  } catch (error) {
    console.error(error);
    console.log(await js("document.body.innerText"));
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
