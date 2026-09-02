import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const [releaseTag, assetsDirectory, outputPath] = process.argv.slice(2);

if (!releaseTag || !assetsDirectory || !outputPath) {
  throw new Error(
    "Usage: node create-runtime-manifest.mjs <release-tag> <assets-directory> <output-path>"
  );
}

const assetPattern =
  /^(ffmpeg|ml-worker|demucs-htdemucs)-(linux|windows|macos|any)-(x86_64|aarch64|any)\.zip$/;
const files = await readdir(assetsDirectory);
const archiveFiles = files.filter((file) => assetPattern.test(file)).sort();
const requiredAssets = [
  "demucs-htdemucs-any-any.zip",
  "ffmpeg-linux-x86_64.zip",
  "ffmpeg-macos-aarch64.zip",
  "ffmpeg-windows-x86_64.zip",
  "ml-worker-linux-x86_64.zip",
  "ml-worker-macos-aarch64.zip",
  "ml-worker-windows-x86_64.zip",
];
const missingAssets = requiredAssets.filter(
  (requiredAsset) => !archiveFiles.includes(requiredAsset)
);

if (missingAssets.length > 0) {
  throw new Error(`Missing runtime assets: ${missingAssets.join(", ")}`);
}

const hashFile = (path) =>
  new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")));
  });

const assets = await Promise.all(
  archiveFiles.map(async (file) => {
    const [, id, platform, architecture] = file.match(assetPattern) ?? [];
    const path = join(assetsDirectory, file);
    const [sha256, details] = await Promise.all([hashFile(path), stat(path)]);

    return {
      id,
      version: releaseTag,
      asset: basename(path),
      sha256,
      size: details.size,
      platform,
      architecture,
      format: "zip",
      installDirectory:
        id === "ffmpeg"
          ? "runtime/ffmpeg"
          : id === "ml-worker"
            ? "runtime/workers"
            : id === "demucs-htdemucs"
              ? "models/demucs/htdemucs"
              : "",
    };
  })
);

await writeFile(
  outputPath,
  `${JSON.stringify({ version: 1, releaseTag, assets }, null, 2)}\n`
);
