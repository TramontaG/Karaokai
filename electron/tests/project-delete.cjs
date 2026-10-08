// Run after npm run build. Never opens or deletes a user's actual project.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "karaokai-delete-test-"));
app.setPath("userData", path.join(root, "profile"));
app.on("window-all-closed", () => {});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const timeout = setTimeout(() => app.exit(2), 30000);
app
  .whenReady()
  .then(async () => {
    for (const view of ["grid", "list"]) {
      const dataRoot = path.join(root, view);
      const directory = path.join(
        dataRoot,
        "projects",
        "project-delete-fixture"
      );
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(
        path.join(directory, "project.json"),
        JSON.stringify({
          version: 1,
          id: "project-delete-fixture",
          name: "Delete fixture",
          duration: 1000,
          createdAt: "1",
          updatedAt: "1",
          processing: [],
          tracks: [],
        })
      );
      fs.writeFileSync(
        path.join(directory, "keep-until-confirmed.txt"),
        "fixture"
      );
      const w = new BrowserWindow({
        show: false,
        width: 1400,
        height: 950,
        webPreferences: {
          offscreen: true,
          contextIsolation: false,
          sandbox: false,
          backgroundThrottling: false,
          preload: path.join(__dirname, "fixtures/project-delete-preload.cjs"),
          additionalArguments: [`--delete-test-root=${dataRoot}`],
          partition: view,
        },
      });
      const errors = [];
      w.webContents.on("render-process-gone", (_, detail) =>
        errors.push(detail.reason)
      );
      const js = (code) => w.webContents.executeJavaScript(code, true);
      await w.loadFile(path.resolve(__dirname, "../../dist/index.html"));
      await wait(900);
      await js(
        `window.addEventListener('unhandledrejection',e=>{window.testRejection=String(e.reason)});document.querySelector('a[href="/library"]').click()`
      );
      await wait(400);
      if (view === "list") {
        await js(
          `document.querySelector('svg.lucide-list').closest('button').click()`
        );
        await wait(100);
      }
      const open = async () => {
        await js(
          `document.querySelector('svg.lucide-ellipsis-vertical,svg.lucide-more-vertical').closest('button').click()`
        );
        await wait(80);
        await js(
          `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Delete project').click()`
        );
        await wait(80);
        assert.equal(
          await js(`!!document.querySelector('dialog[open]')`),
          true
        );
      };
      await open();
      assert.equal(await js(`document.activeElement.textContent`), "Cancel");
      await js(`document.querySelector('dialog button').click()`);
      await wait(80);
      assert.equal(await js(`!!document.querySelector('dialog[open]')`), false);
      assert.equal(await js(`window.deleteProbe.attempts`), 0);
      assert.ok(fs.existsSync(directory));
      await open();
      await js(
        `document.querySelector('dialog').dispatchEvent(new Event('cancel',{cancelable:true}))`
      );
      await wait(80);
      assert.equal(await js(`!!document.querySelector('dialog[open]')`), false);
      await open();
      await js(
        `const button=document.querySelector('[data-destructive]');button.click();button.click();`
      );
      await wait(80);
      assert.equal(await js(`window.deleteProbe.attempts`), 1);
      assert.equal(
        await js(
          `Array.from(document.querySelectorAll('dialog button')).every(b=>b.disabled)`
        ),
        true
      );
      await js(
        `document.querySelector('dialog').dispatchEvent(new Event('cancel',{cancelable:true}))`
      );
      assert.equal(await js(`!!document.querySelector('dialog[open]')`), true);
      await js(`window.deleteProbe.release()`);
      await wait(100);
      assert.equal(
        await js(`!!document.querySelector('dialog [role="alert"]')`),
        true
      );
      assert.ok(fs.existsSync(directory));
      await js(
        `window.deleteProbe.fail=false;document.querySelector('[data-destructive]').click()`
      );
      await wait(50);
      await js(`window.deleteProbe.release()`);
      await wait(250);
      assert.ok(!fs.existsSync(directory));
      assert.equal(await js(`!!document.querySelector('dialog[open]')`), false);
      assert.equal(
        await js(`document.body.textContent.includes('Delete fixture')`),
        false
      );
      assert.equal(
        await js(
          `JSON.parse(localStorage.getItem('karaokai.user-preferences')).favoriteProjectIds.length`
        ),
        0
      );
      assert.equal(await js(`window.testRejection ?? null`), null);
      assert.deepEqual(errors, []);
      w.destroy();
      console.log(
        `PASS ${view}: cancel, Escape, duplicate clicks, pending state, failure/retry, actual temporary-directory deletion`
      );
    }
    clearTimeout(timeout);
    app.exit(0);
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
