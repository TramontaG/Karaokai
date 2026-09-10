export function drawMediaBackground(
  context: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  fit: "cover" | "contain"
) {
  const width =
    media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const height =
    media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  if (!width || !height) return;
  const scale =
    fit === "contain"
      ? Math.min(context.canvas.width / width, context.canvas.height / height)
      : Math.max(context.canvas.width / width, context.canvas.height / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  context.drawImage(
    media,
    (context.canvas.width - renderedWidth) / 2,
    (context.canvas.height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight
  );
}

export function waitForVideoSeek(video: HTMLVideoElement, seconds: number) {
  return new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - seconds) < 0.01) {
      resolve();
      return;
    }
    const finish = () => {
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish, { once: true });
    video.currentTime = seconds;
  });
}

export function jpegBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
}

export const backgroundMimeType = (asset: string) => {
  const extension = asset.split(".").pop()?.toLowerCase();
  if (extension === "mp4") return "video/mp4";
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";
  if (extension === "mkv") return "video/x-matroska";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
};

export const isVideoBackgroundAsset = (asset: string) =>
  ["mp4", "webm", "mov", "mkv"].includes(
    asset.split(".").pop()?.toLowerCase() ?? ""
  );
