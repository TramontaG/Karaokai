const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-phrase-align-test-"))
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
        "fixtures/phrase-fine-alignment-preload.cjs"
      ),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code, true);
  const phrase = () =>
    js(
      `JSON.parse(localStorage.getItem('signature-test-project')).tracks.find(track=>track.type==='subtitle').phrases[0]`
    );
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await wait(1200);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await wait(300);
    await js(`document.querySelector('[role="button"]').click()`);
    await wait(500);
    await js(`document.querySelector('[data-timeline-phrase]').click()`);
    await wait(200);
    await js(
      `Array.from(document.querySelectorAll('[role="tab"]')).find(tab=>tab.textContent==='Frase').click()`
    );
    await wait(100);
    const button = `Array.from(document.querySelectorAll('button')).find(button=>button.textContent?.includes('Alinhamento fino com IA'))`;
    assert.equal(await js(`Boolean(${button})`), true);
    assert.equal(await js(`${button}.disabled`), false);
    await js(`${button}.click()`);
    await wait(100);
    assert.equal(
      await js(
        `document.body.innerText.includes('Alinhando palavras com WhisperX')`
      ),
      true
    );
    assert.equal(await js(`window.fineAlignmentCalls.length`), 1);
    assert.deepEqual(
      await js(
        `window.fineAlignmentCalls[0] && [window.fineAlignmentCalls[0].start,window.fineAlignmentCalls[0].end,window.fineAlignmentCalls[0].text]`
      ),
      [1000, 3000, "Hello world"]
    );
    await wait(900);
    assert.equal(
      await js(`document.body.innerText.includes('Palavras realinhadas')`),
      true
    );
    let current = await phrase();
    assert.equal(current.text, "Hello world");
    assert.deepEqual(
      current.words
        .filter((word) => word.type !== "gap")
        .map(({ start, end }) => [start, end]),
      [
        [1250, 1760],
        [1760, 2800],
      ]
    );
    assert.equal(
      current.words.some((word) => word.type === "gap"),
      false
    );
    assert.equal(current.style.scale, 1);
    await js(`${button}.click()`);
    await wait(900);
    current = await phrase();
    assert.deepEqual(
      current.words
        .filter((word) => word.type === "gap")
        .map(({ start, end }) => [start, end]),
      [[1700, 2300]]
    );
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}))`
    );
    await wait(1100);
    current = await phrase();
    assert.deepEqual(
      current.words
        .filter((word) => word.type !== "gap")
        .map(({ start, end }) => [start, end]),
      [
        [1250, 1760],
        [1760, 2800],
      ]
    );
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}))`
    );
    await wait(1100);
    current = await phrase();
    assert.deepEqual(
      current.words
        .filter((word) => word.type !== "gap")
        .map(({ start, end }) => [start, end]),
      [
        [1000, 2000],
        [2000, 3000],
      ]
    );
    console.log(
      "PASS: phrase fine alignment, short pause removal, long pause preservation, undo"
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    console.log(await js("document.body.innerText"));
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
