// Checks input editing against a selected phrase in an isolated project.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
app.setPath(
  "userData",
  fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-input-test-"))
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
      preload: path.join(__dirname, "fixtures/input-shortcuts-preload.cjs"),
    },
  });
  const js = async (code) => {
    try {
      return await window.webContents.executeJavaScript(code, true);
    } catch (error) {
      console.error("Failed renderer expression:", code);
      throw error;
    }
  };
  const key = async (keyCode) => {
    window.webContents.sendInputEvent({ type: "keyDown", keyCode });
    window.webContents.sendInputEvent({ type: "keyUp", keyCode });
    await wait(100);
  };
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
    window.webContents.focus();
    const focusScale = () =>
      js(
        `(()=>{const input=document.querySelector('input[data-draggable-number][min="25"]');input.focus();input.select();})()`
      );
    for (const deleteKey of ["Backspace", "Delete"]) {
      await focusScale();
      await key(deleteKey);
      assert.equal(
        await js(`document.querySelectorAll('[data-timeline-phrase]').length`),
        1,
        "Editing an input must preserve the selected phrase"
      );
      assert.equal(
        await js(
          `document.querySelector('input[data-draggable-number][min="25"]').value`
        ),
        "",
        "Delete must clear the numeric draft"
      );
      await window.webContents.insertText("150");
      await wait(100);
    }
    await key("Enter");
    await wait(300);
    assert.equal(
      await js(
        `document.activeElement===document.querySelector('input[data-draggable-number][min="25"]')`
      ),
      false,
      "Enter must commit and release input focus"
    );
    // Offscreen Electron does not reliably forward the native blur to React.
    await js(
      `document.querySelector('input[data-draggable-number][min="25"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`
    );
    await wait(1200);
    const scale = await js(
      `JSON.parse(localStorage.getItem('signature-test-project')).tracks.find(track=>track.type==='subtitle').phrases[0].style.scale`
    );
    assert.equal(scale, 1.5, "Enter must save the new scale");
    // Other focused form controls must not trigger phrase deletion either.
    await js(`document.querySelector('textarea').focus()`);
    await key("Delete");
    assert.equal(
      await js(`document.querySelectorAll('[data-timeline-phrase]').length`),
      1
    );
    await js(`document.querySelector('select').focus()`);
    await key("Backspace");
    assert.equal(
      await js(`document.querySelectorAll('[data-timeline-phrase]').length`),
      1
    );
    await js(`document.activeElement.blur();document.body.focus()`);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}))`
    );
    await wait(300);
    assert.equal(
      await js(`document.querySelectorAll('[data-timeline-phrase]').length`),
      0,
      "Delete must still remove phrases when no field is focused"
    );
    console.log(
      "PASS: numeric Delete/Backspace, Enter commit, protected textarea/select, timeline deletion"
    );
    app.exit(0);
  } catch (error) {
    console.error(error);
    console.log(await js("document.body.innerText"));
    app.exit(1);
  }
});
setTimeout(() => app.exit(2), 20000);
