const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-prefill-test-"))
);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, "fixtures/track-prefill-preload.cjs"),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code);
  const waitFor = (condition) =>
    js(
      `new Promise(resolve => { const timer = setInterval(() => { if (${condition}) { clearInterval(timer); resolve(true); } }, 20); })`
    );
  const drop = (name) =>
    js(`(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['test'], '${name}', { type: 'audio/mpeg' }));
      document.querySelector('h1').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    })()`);
  const fields = () =>
    js(
      `Array.from(document.querySelectorAll('[aria-labelledby="track-title"] input')).map(input => input.value)`
    );
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await waitFor(`document.querySelector('input[type="file"]')`);
    await drop("tagged.mp3");
    await waitFor(`document.querySelector('#track-title')`);
    assert.deepEqual(await fields(), ["Tagged Artist", "Tagged Song"]);
    assert.equal(
      await js(`window.trackPrefillCalls.includes('identify_project_track')`),
      false,
      "Creating a project must not call AcoustID"
    );
    await js(`document.querySelector('a[href="/"]').click()`);
    await waitFor(`document.querySelector('input[type="file"]')`);
    await drop("untagged.mp3");
    await waitFor(`document.querySelector('#track-title')`);
    assert.deepEqual(await fields(), ["", "untagged"]);
    assert.equal(
      await js(`window.trackPrefillCalls.includes('identify_project_track')`),
      false
    );
    console.log(
      "PASS: MP3 tags prefill the dialog; missing tags use existing defaults; no AcoustID call"
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
