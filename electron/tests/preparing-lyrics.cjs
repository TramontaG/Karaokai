const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-lyrics-test-"))
);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, "fixtures/preparing-lyrics-preload.cjs"),
    },
  });
  const js = (code) => window.webContents.executeJavaScript(code);
  const waitFor = (condition) =>
    js(
      `new Promise(resolve => { const timer = setInterval(() => { if (${condition}) { clearInterval(timer); resolve(true); } }, 20); })`
    );
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await waitFor(`document.querySelector('input[type="file"]')`);
    await js(`(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['test'], 'sample.wav', { type: 'audio/wav' }));
      document.querySelector('h1').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    })()`);
    await waitFor(`document.querySelector('#lrclib-title')`);
    const confirm = `Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Sim, usar esta letra')).click()`;
    assert.equal(
      await js(
        `Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Sim, usar esta letra')).disabled`
      ),
      false,
      "Lyrics can be confirmed while separation is running"
    );
    await js(confirm);
    await waitFor(
      `document.querySelector('[role="status"]')?.textContent.includes('Iniciando o alinhamento')`
    );
    assert.equal(
      await js(`Boolean(document.querySelector('#lrclib-title'))`),
      false
    );
    await waitFor(
      `document.querySelector('#lrclib-title') && document.querySelector('[role="alert"]')?.textContent.includes('Could not start alignment')`
    );
    await js(confirm);
    await waitFor(
      `document.querySelector('[role="status"]')?.textContent.includes('Iniciando o alinhamento')`
    );
    await waitFor(
      `document.querySelector('[role="status"]')?.textContent.includes('quando a separação dos vocais terminar')`
    );
    await waitFor(
      `document.querySelector('[role="status"]')?.textContent.includes('Acompanhe o alinhamento')`
    );
    assert.equal(
      await js(`Boolean(document.querySelector('#lrclib-title'))`),
      false
    );
    console.log(
      "PASS: lyrics confirm before separation, wait for stems, and restore review on start failure"
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
