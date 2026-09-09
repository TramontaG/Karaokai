function errorText(reason: unknown) {
  return reason instanceof Error
    ? reason.message.toLocaleLowerCase()
    : String(reason).toLocaleLowerCase();
}

export type AlbumArtError = "missing" | "unavailable";
export type YoutubeImportError =
  "invalidUrl" | "restricted" | "dependency" | "unavailable";

export function albumArtError(reason: unknown): AlbumArtError {
  const message = errorText(reason);
  if (
    message.includes("no embedded album artwork") ||
    message.includes("album art extraction is available")
  )
    return "missing";
  return "unavailable";
}

export function youtubeImportError(reason: unknown): YoutubeImportError {
  const message = errorText(reason);
  if (message.includes("valid youtube link")) return "invalidUrl";
  if (
    [
      "sign in",
      "not a bot",
      "cookies",
      "private",
      "members-only",
      "age-restricted",
    ].some((term) => message.includes(term))
  )
    return "restricted";
  if (["yt-dlp", "ffmpeg", "python"].some((term) => message.includes(term)))
    return "dependency";
  return "unavailable";
}
