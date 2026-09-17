import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, mkdir, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { download } = require("../electron/runtime.cjs");

for (const scenario of ["success", "interrupted", "empty", "disk error"]) {
  test(`runtime download: ${scenario}`, async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), "karaokai-download-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const destination = path.join(root, "model.bin");
    const originalFetch = globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });
    globalThis.fetch = async () =>
      new Response(scenario === "empty" ? "" : "model data", {
        headers: {
          "content-length":
            scenario === "interrupted"
              ? "100"
              : scenario === "empty"
                ? "0"
                : "10",
        },
      });
    if (scenario === "disk error") await mkdir(`${destination}.part`);
    if (scenario === "success") {
      await download("https://example.invalid/model", destination);
      assert.equal(await readFile(destination, "utf8"), "model data");
      assert.deepEqual(await readdir(root), ["model.bin"]);
    } else {
      await assert.rejects(
        download("https://example.invalid/model", destination)
      );
      await assert.rejects(readFile(destination));
      if (scenario !== "disk error") assert.deepEqual(await readdir(root), []);
    }
  });
}

test("bootstrap requires every runtime component, including yt-dlp", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "karaokai-bootstrap-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = await readFile(
    new URL("../electron/runtime.cjs", import.meta.url),
    "utf8"
  );
  const sandbox = {
    require: createRequire(new URL("../electron/runtime.cjs", import.meta.url)),
    module: { exports: {} },
    process,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    source +
      `
    modelInstalled = () => true;
    commandWorks = () => false;
    ensureRuntime = async () => {};
    runtimeComponents = async () => [{ verified: true }, { verified: false }];
  `,
    sandbox
  );
  const context = { dataRoot: () => root, appPath: root, emit() {} };
  assert.equal(
    (await sandbox.module.exports.run("bootstrap_app", {}, context))
      .runtimeReady,
    false
  );
  vm.runInContext(
    "runtimeComponents = async () => [{ verified: true }, { verified: true }];",
    sandbox
  );
  assert.equal(
    (await sandbox.module.exports.run("bootstrap_app", {}, context))
      .runtimeReady,
    true
  );
});

test("runtime installation deduplicates requests and releases the lock after failure", async () => {
  const source = await readFile(
    new URL("../electron/runtime.cjs", import.meta.url),
    "utf8"
  );
  const sandbox = {
    require: createRequire(new URL("../electron/runtime.cjs", import.meta.url)),
    module: { exports: {} },
    process,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    source +
      `
    let rejectInstall;
    let calls = 0;
    installRuntime = () => { calls++; return new Promise((resolve, reject) => { rejectInstall = reject; }); };
    module.exports.start = ensureRuntime;
    module.exports.fail = () => rejectInstall(new Error("interrupted"));
    module.exports.calls = () => calls;
  `,
    sandbox
  );
  const { start, fail, calls } = sandbox.module.exports;
  const first = start("root", { id: "tiny" });
  assert.equal(start("root", { id: "tiny" }), first);
  await assert.rejects(start("root", { id: "base" }), /already in progress/);
  assert.equal(calls(), 1);
  fail();
  await assert.rejects(first, /interrupted/);
  const retry = start("root", { id: "base" });
  assert.equal(calls(), 2);
  fail();
  await assert.rejects(retry, /interrupted/);
});
