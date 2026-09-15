// Run after npm run build: electron electron/tests/time-signatures.cjs
// Uses a temporary profile and simulated project storage; no user projects or models are accessed.
const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const os = require("node:os");
const root = path.resolve(__dirname, "../..");
const fs = require("node:fs");
const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), "karaokai-signature-ui-")
);
app.setPath("userData", directory);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 950,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "fixtures/time-signatures-preload.cjs"),
      contextIsolation: false,
      sandbox: false,
      backgroundThrottling: false,
      offscreen: true,
    },
  });
  win.webContents.on("console-message", (_e, ...args) =>
    console.log("CONSOLE", ...args)
  );
  const js = (s) => win.webContents.executeJavaScript(s, true);
  try {
    await win.loadFile(path.join(root, "dist/index.html"));
    await delay(1800);
    const clickText = async (text) => {
      await js(
        `Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()===${JSON.stringify(text)}).click()`
      );
      await delay(100);
    };
    const clickLabel = async (label) => {
      await js(
        `document.querySelector('[aria-label="'+${JSON.stringify(label)}+'"]').click()`
      );
      await delay(100);
    };
    const markers = () =>
      js(
        `Array.from(document.querySelectorAll('[data-time-signature-marker]')).map(x=>({text:x.querySelector('button').textContent,left:x.style.left}))`
      );
    const assert = require("node:assert/strict");
    await js(`document.querySelector('a[href="/library"]').click()`);
    await delay(200);
    await js(`document.querySelector('[role="button"]').click()`);
    await delay(500);

    const bpmLabel = await js(
      `Array.from(document.querySelectorAll('button')).find(x=>x.getAttribute('aria-label')?.startsWith('BPM /')).getAttribute('aria-label')`
    );
    await clickLabel(bpmLabel);
    await clickText("Mudança de compasso");
    await clickText("3/4");
    await delay(700);
    fs.writeFileSync(
      path.join(directory, "popover.png"),
      (await win.webContents.capturePage()).toPNG()
    );
    await clickText("Marcar no grid");
    assert.equal(
      await js(`!!document.querySelector('[data-time-signature-placement]')`),
      true
    );
    const place = async (fraction) => {
      await js(
        `(()=>{const el=document.querySelector('[data-time-signature-placement]');const b=el.getBoundingClientRect();el.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:b.left+b.width*${fraction}}));el.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0,clientX:b.left+b.width*${fraction}}));})()`
      );
      await delay(400);
    };
    await place(0.125);
    assert.deepEqual(await markers(), [{ text: "3/4", left: "12.5%" }]);
    await clickLabel(bpmLabel);
    await clickText("6/8");
    await clickText("Marcar no grid");
    await place(0.5);
    assert.deepEqual(await markers(), [
      { text: "3/4", left: "12.5%" },
      { text: "6/8", left: "50%" },
    ]);
    fs.writeFileSync(
      path.join(directory, "grid.png"),
      (await win.webContents.capturePage()).toPNG()
    );
    // Exercise pointer capture with real mouse input, preserving the grab offset.
    const drag = await js(
      `(()=>{const handle=document.querySelector('[data-time-signature-marker] button');const b=handle.getBoundingClientRect();const content=handle.closest('[data-time-signature-marker]').parentElement.getBoundingClientRect();return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2),delta:Math.round(content.width/32)};})()`
    );
    win.webContents.sendInputEvent({
      type: "mouseDown",
      x: drag.x,
      y: drag.y,
      button: "left",
      clickCount: 1,
    });
    win.webContents.sendInputEvent({
      type: "mouseMove",
      x: drag.x + drag.delta,
      y: drag.y,
      button: "left",
    });
    await delay(100);
    win.webContents.sendInputEvent({
      type: "mouseUp",
      x: drag.x + drag.delta,
      y: drag.y,
      button: "left",
      clickCount: 1,
    });
    await delay(400);
    assert.equal((await markers())[0].left, "15.625%");
    await js(
      `document.querySelector('[data-time-signature-marker] button').dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}))`
    );
    await delay(400);
    assert.equal((await markers())[0].left, "18.75%");
    await clickLabel("Editar fórmula de compasso");
    await js(
      `Array.from(document.querySelector(':popover-open').querySelectorAll('button')).find(x=>x.textContent==='2/4').click()`
    );
    await delay(400);
    assert.equal((await markers())[0].text, "2/4");
    await js(`document.querySelector(':popover-open').hidePopover()`);
    await clickLabel("Excluir mudança de compasso");
    assert.equal((await markers()).length, 1);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}))`
    );
    await delay(400);
    assert.equal((await markers()).length, 2);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,shiftKey:true,bubbles:true}))`
    );
    await delay(400);
    assert.equal((await markers()).length, 1);
    await clickLabel(bpmLabel);
    await clickText("Marcar no grid");
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`
    );
    await delay(100);
    assert.equal(
      await js(`!!document.querySelector('[data-time-signature-placement]')`),
      false
    );
    const saved = await js(
      `JSON.parse(localStorage.getItem('signature-test-project')).tempo.timeSignatures`
    );
    assert.equal(saved.length, 1);
    assert.equal(saved[0].numerator, 6);
    assert.equal(saved[0].denominator, 8);
    await win.reload();
    await delay(1000);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await delay(200);
    await js(`document.querySelector('[role="button"]').click()`);
    await delay(500);
    assert.deepEqual(await markers(), [{ text: "6/8", left: "50%" }]);
    const tempoMarkers = () =>
      js(
        `Array.from(document.querySelectorAll('[data-tempo-change-marker]')).map(x=>({text:x.querySelector('button').textContent,left:x.style.left}))`
      );
    const setBpm = async (value) => {
      win.webContents.focus();
      await js(
        `(()=>{const input=document.querySelector(':popover-open input[aria-label="Novo BPM"]');input.focus();input.select();})()`
      );
      await win.webContents.insertText(String(value));
      await delay(100);
      await js(
        `(()=>{const input=document.querySelector(':popover-open input[aria-label="Novo BPM"]');input.blur();input.dispatchEvent(new FocusEvent("focusout",{bubbles:true}));})()`
      );
      await delay(100);
    };
    await clickLabel(bpmLabel);
    await clickText("Mudança de BPM");
    await setBpm("60");
    await clickText("Marcar no grid");
    assert.equal(
      await js(`!!document.querySelector('[data-time-signature-placement]')`),
      false
    );
    await js(
      `(()=>{const el=document.querySelector('[data-tempo-change-placement]');const b=el.getBoundingClientRect();el.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0,clientX:b.left+b.width*.5}));})()`
    );
    await delay(400);
    assert.deepEqual(await tempoMarkers(), [{ text: "60 BPM", left: "50%" }]);
    assert.deepEqual(await markers(), [{ text: "6/8", left: "50%" }]);
    await clickLabel("Editar mudança de BPM");
    await setBpm("90.5");
    assert.equal((await tempoMarkers())[0].text, "90.5 BPM");
    await js(`document.querySelector(':popover-open').hidePopover()`);
    await js(
      `document.querySelector('[data-tempo-change-marker] button').dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}))`
    );
    await delay(400);
    assert.equal((await tempoMarkers())[0].left, "53.125%");
    await clickLabel("Excluir mudança de BPM");
    assert.equal((await tempoMarkers()).length, 0);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}))`
    );
    await delay(400);
    assert.equal((await tempoMarkers()).length, 1);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,shiftKey:true,bubbles:true}))`
    );
    await delay(400);
    assert.equal((await tempoMarkers()).length, 0);
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}))`
    );
    await delay(400);
    await win.reload();
    await delay(1000);
    await js(`document.querySelector('a[href="/library"]').click()`);
    await delay(200);
    await js(`document.querySelector('[role="button"]').click()`);
    await delay(500);
    assert.deepEqual(await tempoMarkers(), [
      { text: "90.5 BPM", left: "53.125%" },
    ]);
    assert.deepEqual(await markers(), [{ text: "6/8", left: "50%" }]);
    await clickLabel(bpmLabel);
    await clickText("Mudança de BPM");
    fs.writeFileSync(
      path.join(directory, "tempo-popover.png"),
      (await win.webContents.capturePage()).toPNG()
    );
    await clickText("Marcar no grid");
    await js(
      `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`
    );
    await delay(100);
    assert.equal(
      await js(`!!document.querySelector('[data-tempo-change-placement]')`),
      false
    );
    console.log(
      "UI PASS: tempo changes, coincident markers, decimal BPM, edit, move, delete, undo/redo, reopen, Escape"
    );
    console.log(
      "UI PASS: insert, multiple signatures, move, edit, delete, undo, redo, Escape, persistence",
      saved,
      "screenshots:",
      directory
    );
  } catch (e) {
    console.error(e);
    app.exit(1);
    return;
  }
  app.exit(0);
});
setTimeout(() => app.exit(2), 45000);
