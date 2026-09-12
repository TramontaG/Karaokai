const assert = require("node:assert/strict");
const { nativeImage } = require("electron");
const { frameBitmap } = require("../render-frames.cjs");
const {
  stampHeight,
  stampBits,
  stampCellWidth,
} = require("../render-frame-format.json");

module.exports = function testFrameBitmap() {
  const width = stampBits * stampCellWidth;
  const height = 8;
  const size = { width, height };
  assert.equal(frameBitmap(nativeImage.createEmpty(), size, 0), null);
  for (const frame of [0, 254, 255, 256, 65535, 2147483647]) {
    const bytes = Buffer.alloc(width * (height + stampHeight) * 4, 17);
    for (let y = height; y < height + stampHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const bit = Math.floor(x / stampCellWidth);
        const value = ((frame + 1) >>> bit) & 1 ? 255 : 0;
        const pixel = (y * width + x) * 4;
        bytes.fill(value, pixel, pixel + 3);
        bytes[pixel + 3] = 255;
      }
    }
    const image = nativeImage.createFromBitmap(bytes, {
      width,
      height: height + stampHeight,
    });
    const video = frameBitmap(image, size, frame);
    assert.deepEqual(
      video,
      bytes.subarray(0, width * height * 4),
      "strip the stamp and preserve all video bytes, including alpha"
    );
    assert.equal(
      frameBitmap(image, size, frame + 1),
      null,
      "reject a queued old paint"
    );
    assert.equal(
      frameBitmap(image, size, frame - 1),
      null,
      "reject a future frame"
    );
    const scaled = image.resize({
      width: width * 2,
      height: (height + stampHeight) * 2,
    });
    assert.ok(
      frameBitmap(scaled, size, frame),
      "read the stamp on a high DPI display"
    );
  }
  console.log(
    "PASS frame stamps: empty/stale/future paints, counter boundaries, alpha, crop and scaling"
  );
};
