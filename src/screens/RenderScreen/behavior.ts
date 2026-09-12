import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import frameFormat from "../../../electron/render-frame-format.json";
import {
  resolveSubtitleStyle,
  resolveTimingCurve,
  wordReadProgress,
  type KaraokeProject,
  type SubtitleTrack,
} from "../../domain/project";
import { useAppContext } from "../../hooks/useAppContext";
import {
  invokeDesktop,
  listenDesktop,
  renderJobId,
  sendDesktop,
} from "../../services/desktop";
import { readProjectAsset } from "../../services/projects";
import {
  phraseEntryCueProgress,
  subtitlePreviewAt,
} from "../EditorScreen/timeline";

const LEGACY_EDITOR_PREVIEW_WIDTH = 640;
const LEGACY_EDITOR_PREVIEW_HEIGHT = 360;

const backgroundMimeType = (asset: string) => {
  const extension = asset.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
};

const isVideoAsset = (asset: string) =>
  ["mp4", "webm", "mov", "mkv"].includes(
    asset.split(".").pop()?.toLowerCase() ?? ""
  );

function subtitlePreview(track: SubtitleTrack, currentTime: number) {
  const timing = subtitlePreviewAt(
    track.phrases,
    currentTime,
    track.animation?.template ?? "template-1"
  );
  const entryCuePhrase =
    timing.currentPhrase ??
    [timing.primaryPhrase, timing.secondaryPhrase].find(
      (phrase) => phrase !== null && phrase.start > currentTime
    ) ??
    null;
  const entryCueProgress = phraseEntryCueProgress(entryCuePhrase, currentTime);
  const entryCueColors = resolveSubtitleStyle(
    track.style,
    entryCuePhrase?.style,
    entryCuePhrase?.words[0]?.style
  );
  const positionReferenceWidth =
    track.style.positionReferenceWidth ?? LEGACY_EDITOR_PREVIEW_WIDTH;
  const positionReferenceHeight =
    track.style.positionReferenceHeight ?? LEGACY_EDITOR_PREVIEW_HEIGHT;
  const words = (timing.primaryPhrase?.words ?? []).map((word) => {
    const style = resolveSubtitleStyle(
      track.style,
      timing.primaryPhrase?.style,
      word.style
    );
    return {
      ...word,
      progress: timing.primaryFullyRead
        ? 1
        : wordReadProgress(
            word,
            currentTime,
            resolveTimingCurve(
              track.curve,
              timing.primaryPhrase?.curve,
              word.curve
            )
          ),
      ...style,
      offsetX: ((word.style?.x ?? 0) / positionReferenceWidth) * 100,
      offsetY: ((word.style?.y ?? 0) / positionReferenceHeight) * 100,
    };
  });
  const secondaryWords = (timing.secondaryPhrase?.words ?? []).map((word) => ({
    ...word,
    progress: 0,
    ...resolveSubtitleStyle(
      track.style,
      timing.secondaryPhrase?.style,
      word.style
    ),
    offsetX: ((word.style?.x ?? 0) / positionReferenceWidth) * 100,
    offsetY: ((word.style?.y ?? 0) / positionReferenceHeight) * 100,
  }));
  return {
    id: track.id,
    timing,
    entryCuePhraseId: entryCuePhrase?.id ?? null,
    words,
    secondaryWords,
    containerStyle: {
      left: `calc(50% + ${((track.style.x ?? 0) / positionReferenceWidth) * 100}%)`,
      top: `calc(50% + ${((track.style.y ?? 0) / positionReferenceHeight) * 100}%)`,
      zIndex: track.zIndex,
    },
    currentStyle: {
      opacity: timing.primaryOpacity,
      "--phrase-offset-x": `${((timing.primaryPhrase?.style?.x ?? 0) / positionReferenceWidth) * 100}cqw`,
      "--phrase-offset-y": `${((timing.primaryPhrase?.style?.y ?? 0) / positionReferenceHeight) * 100}cqw`,
    } as CSSProperties,
    nextPhraseStyle: {
      opacity: timing.secondaryOpacity,
      top: `${timing.secondaryOffset * 50}%`,
      transform: `translate(calc(-50% + ${((timing.secondaryPhrase?.style?.x ?? 0) / positionReferenceWidth) * 100}cqw), calc(${(timing.secondaryOffset - 1) * 50}% + ${timing.secondaryOffset * 0.75}rem + ${((timing.secondaryPhrase?.style?.y ?? 0) / positionReferenceHeight) * 100}cqw)) scale(${timing.secondaryScale})`,
    },
    entryCueStyle: {
      "--entry-cue-progress": entryCueProgress ?? 0,
      "--entry-cue-empty-color": entryCueColors.unreadColor,
      "--entry-cue-fill-color": entryCueColors.readColor,
      "--entry-cue-scale": entryCueColors.scale,
    } as CSSProperties,
    showEntryCue: entryCueProgress !== null && !timing.suppressEntryCue,
    showCurrentPhrase: words.length > 0,
    showNextPhrase: timing.secondaryPhrase !== null,
    visible:
      track.visible && (words.length > 0 || timing.secondaryPhrase !== null),
  };
}

type RenderJobData = {
  project: KaraokeProject;
  storageDirectory: string | null;
  videoCompositedByEncoder: boolean;
};

export function useBehavior(_: Record<string, never>) {
  const jobId = renderJobId();
  const [data] = useAppContext();
  const [job, setJob] = useState<RenderJobData | null>(null);
  const [renderFrame, setRenderFrame] = useState({ frame: -1, time: 0 });
  const currentTime = renderFrame.time;
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const project = job?.project ?? null;
  const background = project?.tracks.find(
    (track) => track.type === "background"
  );
  const preset = background?.preset ?? "solid";
  const videoCompositedByEncoder = job?.videoCompositedByEncoder ?? false;
  const asset =
    preset === "image"
      ? (background?.imageAsset ??
        (background?.asset && !isVideoAsset(background.asset)
          ? background.asset
          : undefined))
      : preset === "album-art"
        ? background?.asset
        : undefined;

  useEffect(() => {
    if (!jobId) return;
    void invokeDesktop<RenderJobData | null>("render_job_data", {
      jobId,
    }).then(setJob);
  }, [jobId]);

  useEffect(() => {
    if (!videoCompositedByEncoder) return;
    document.documentElement.dataset.renderVideoOverlay = "true";
    return () => {
      delete document.documentElement.dataset.renderVideoOverlay;
    };
  }, [videoCompositedByEncoder]);

  useEffect(() => {
    if (!jobId || !project || !backgroundReady) return;
    sendDesktop("render-ready", jobId);
  }, [backgroundReady, jobId, project]);

  useEffect(() => {
    if (!jobId) return;
    let disposed = false;
    let unlisten: () => void = () => undefined;
    void listenDesktop<{ jobId: string; frame: number; time: number }>(
      "render-frame",
      ({ payload }) => {
        if (payload.jobId !== jobId) return;
        // The timestamp and pixel stamp must belong to the same React commit.
        setRenderFrame({ frame: payload.frame, time: payload.time });
      }
    ).then((dispose) => {
      if (disposed) dispose();
      else unlisten = dispose;
    });
    return () => {
      disposed = true;
      unlisten();
    };
  }, [jobId]);

  useEffect(() => {
    if (!project) {
      setBackgroundUrl(null);
      setBackgroundReady(false);
      return;
    }
    if (!asset) {
      setBackgroundUrl(null);
      setBackgroundReady(true);
      return;
    }
    setBackgroundReady(false);
    let url: string | null = null;
    let disposed = false;
    void readProjectAsset(
      project.id,
      asset,
      job?.storageDirectory ?? data.preferences.storageDirectory
    ).then((bytes) => {
      if (disposed) return;
      url = URL.createObjectURL(
        new Blob([bytes], { type: backgroundMimeType(asset) })
      );
      setBackgroundUrl(url);
    });
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [
    asset,
    data.preferences.storageDirectory,
    job?.storageDirectory,
    project,
  ]);

  const previews = useMemo(
    () =>
      project?.tracks
        .filter((track): track is SubtitleTrack => track.type === "subtitle")
        .map((track) => subtitlePreview(track, currentTime))
        .filter((preview) => preview.visible) ?? [],
    [currentTime, project]
  );
  const backgroundStyle = {
    background: videoCompositedByEncoder
      ? "transparent"
      : preset === "gradient"
        ? `linear-gradient(${background?.gradientAngle ?? 135}deg, ${background?.gradientStart ?? "#273660"}, ${background?.gradientEnd ?? "#0b1732"})`
        : (background?.color ?? "#0b1732"),
    "--background-fit": background?.fit ?? "cover",
  } as CSSProperties;

  const stamp = renderFrame.frame + 1;
  const stampStops = Array.from({ length: frameFormat.stampBits }, (_, bit) => {
    const color = (stamp >>> bit) & 1 ? "#fff" : "#000";
    return `${color} ${bit * frameFormat.stampCellWidth}px ${(bit + 1) * frameFormat.stampCellWidth}px`;
  });
  const frameStampStyle = {
    background: `linear-gradient(90deg, ${stampStops.join(", ")})`,
    width: frameFormat.stampBits * frameFormat.stampCellWidth,
    height: frameFormat.stampHeight,
  };
  const canvasStyle = { height: `calc(100vh - ${frameFormat.stampHeight}px)` };

  return {
    canvasStyle,
    frameStampStyle,
    backgroundSource: backgroundUrl ?? undefined,
    backgroundStyle,
    hasBackgroundImage: backgroundUrl !== null,
    onBackgroundLoad: () => setBackgroundReady(true),
    previews,
    videoCompositedByEncoder,
  };
}
