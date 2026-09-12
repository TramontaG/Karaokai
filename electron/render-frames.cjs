const {
  stampHeight,
  stampBits,
  stampCellWidth,
} = require("./render-frame-format.json");

// The renderer commits this black/white stamp with the subtitle state. Reading
// it from the pixels (rather than an IPC ACK) also rejects queued, stale paints.
// Zero is reserved for the initial page, before the first requested frame.
function frameBitmap(image, { width, height }, frame) {
  if (image.isEmpty()) return null;
  const captureHeight = height + stampHeight;
  const size = image.getSize();
  const normalized =
    size.width === width && size.height === captureHeight
      ? image
      : image.resize({ width, height: captureHeight, quality: "good" });
  const bitmap = normalized.toBitmap();
  if (bitmap.byteLength !== width * captureHeight * 4)
    throw new Error(`Invalid BGRA buffer for render frame ${frame}`);
  const row = (height + Math.floor(stampHeight / 2)) * width * 4;
  let stamp = 0;
  for (let bit = 0; bit < stampBits; bit += 1) {
    const pixel =
      row + (bit * stampCellWidth + Math.floor(stampCellWidth / 2)) * 4;
    const value = bitmap[pixel];
    // Resampling on a high DPI display can soften the cell slightly.
    if (bitmap[pixel + 3] < 223 || (value > 32 && value < 223)) return null;
    if (value >= 223) stamp = (stamp | (1 << bit)) >>> 0;
  }
  if (stamp !== frame + 1) return null;
  // The stamp is outside the video area. Strip it without copying the frame.
  return bitmap.subarray(0, width * height * 4);
}

module.exports = { frameBitmap };
