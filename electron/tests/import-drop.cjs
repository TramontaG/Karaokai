const { app, BrowserWindow } = require("electron");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-drop-"));
const audioPath = path.join(testDirectory, "sample.wav");
fs.writeFileSync(audioPath, Buffer.from("RIFF0000WAVE"));
app.setPath("userData", testDirectory);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, "fixtures/import-drop-preload.cjs"),
    },
  });
  try {
    await window.loadFile(path.resolve(__dirname, "../../dist/index.html"));
    await window.webContents.executeJavaScript(
      `new Promise(resolve => { const timer = setInterval(() => { if (document.querySelector('input[type="file"]')) { clearInterval(timer); resolve(); } }, 20); })`
    );
    const missingPath = await window.webContents.executeJavaScript(`(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['test'], 'synthetic.wav', { type: 'audio/wav' }));
      const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer });
      document.querySelector('h1').dispatchEvent(event);
      return event.defaultPrevented;
    })()`);
    assert.equal(missingPath, true);
    const missingPathError = await window.webContents.executeJavaScript(
      `new Promise(resolve => { const timer = setInterval(() => { const alert = document.querySelector('[role="alert"]'); if (alert) { clearInterval(timer); resolve(alert.textContent); } }, 20); })`
    );
    assert.match(
      missingPathError,
      /Não foi possível acessar o arquivo arrastado/,
      "An inaccessible file must show a visible error"
    );
    await window.webContents.executeJavaScript(
      `(() => { const input = document.createElement('input'); input.type = 'file'; input.id = 'drop-fixture-file'; document.body.appendChild(input); })()`
    );
    window.webContents.debugger.attach("1.3");
    const { root } =
      await window.webContents.debugger.sendCommand("DOM.getDocument");
    const { nodeId } = await window.webContents.debugger.sendCommand(
      "DOM.querySelector",
      { nodeId: root.nodeId, selector: "#drop-fixture-file" }
    );
    await window.webContents.debugger.sendCommand("DOM.setFileInputFiles", {
      files: [audioPath],
      nodeId,
    });
    const result = await window.webContents.executeJavaScript(`(() => {
      const file = document.querySelector('#drop-fixture-file').files[0];
      const transfer = new DataTransfer();
      transfer.items.add(file);
      const target = document.querySelector('h1');
      const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer });
      target.dispatchEvent(event);
      return { canceled: event.defaultPrevented, path: window.karaokaiDesktop.filePath(file) };
    })()`);
    assert.equal(
      result.canceled,
      true,
      "Drop outside the dotted area must be accepted"
    );
    assert.equal(
      result.path,
      audioPath,
      "Electron must resolve the native file path"
    );
    const sourcePath = await window.webContents.executeJavaScript(
      `new Promise(resolve => { const timer = setInterval(() => { if (window.importDropCalls.length) { clearInterval(timer); resolve(window.importDropCalls[0].sourcePath); } }, 20); })`
    );
    assert.equal(
      sourcePath,
      audioPath,
      "The import must receive the dropped file path"
    );
    console.log("PASS: page-wide file drop imports a native-backed file");
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
