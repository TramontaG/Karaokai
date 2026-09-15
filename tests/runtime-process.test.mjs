import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  runCommand,
  PACKAGE_INTEGRITY_CHECK,
} = require("../electron/runtime.cjs");

test("runtime commands return trimmed output", async () => {
  assert.equal(
    await runCommand(process.execPath, ["-e", "console.log('ready')"]),
    "ready"
  );
});

test("runtime failures retain exit code and diagnostics", async () => {
  await assert.rejects(
    runCommand(process.execPath, [
      "-e",
      "console.error('broken library'); process.exit(7)",
    ]),
    /exited with code 7\nbroken library/
  );
});

test(
  "runtime crashes report the signal instead of null",
  { skip: process.platform === "win32" },
  async () => {
    await assert.rejects(
      runCommand(process.execPath, [
        "-e",
        "process.kill(process.pid, 'SIGTERM')",
      ]),
      /terminated by SIGTERM/
    );
  }
);

test("runtime commands time out", async () => {
  await assert.rejects(
    runCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      timeoutMs: 100,
    }),
    /did not finish within/
  );
});

test("package integrity check rejects truncated and missing library files", async () => {
  const script = `
import pathlib, sys, tempfile
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    sys.path.insert(0, directory)
    metadata = root / 'example-1.0.dist-info'
    metadata.mkdir()
    (metadata / 'METADATA').write_text('Name: example\\nVersion: 1.0\\n')
    (metadata / 'RECORD').write_text('native.so,,8\\n')
    library = root / 'native.so'
    library.write_text('complete')
    check = ${JSON.stringify(PACKAGE_INTEGRITY_CHECK)}
    exec(check, {})
    for truncated in (True, False):
        if truncated:
            library.write_text('short')
        else:
            library.unlink()
        try:
            exec(check, {})
        except SystemExit as error:
            assert 'Incomplete Python packages: example' in str(error)
        else:
            raise AssertionError('Damaged package was accepted')
`;
  await runCommand(process.env.TEST_PYTHON || "python3", ["-S", "-c", script]);
});
