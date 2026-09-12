import { useEffect, useLayoutEffect } from "react";
import { resolveSubtitleStyle, subtitleFontStack } from "../../domain/project";
import { isDesktop } from "../../services/desktop";
import { saveProjectThumbnail } from "../../services/projects";
import { drawMediaBackground, jpegBlob } from "../../util/editor/media";
import { subtitlePreviewView } from "../../util/editor/subtitlePreview";
import type { EditorBackground } from "./useEditorBackground";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorDataState: Pick<EditorDataState, "project" | "setError">;
  editorProjectValues: Pick<
    EditorProjectValues,
    "firstPhraseStart" | "projectBackgroundTrack" | "subtitleTracks"
  >;
  editorBackground: Pick<
    EditorBackground,
    "backgroundPreset" | "backgroundFit"
  >;
  editorTransientState: Pick<
    EditorTransientState,
    "backgroundMediaReady" | "backgroundAssetUrl"
  >;
  editorRuntime: Pick<
    EditorRuntime,
    | "thumbnailCaptureRef"
    | "thumbnailCaptureKeyRef"
    | "backgroundVideo"
    | "backgroundImage"
    | "projectRef"
  >;
  editorEnvironment: Pick<EditorEnvironment, "data">;
}

export function useEditorThumbnail({
  editorDataState,
  editorProjectValues,
  editorBackground,
  editorTransientState,
  editorRuntime,
  editorEnvironment,
}: Options) {
  const { project, setError } = editorDataState;
  const { firstPhraseStart, projectBackgroundTrack, subtitleTracks } =
    editorProjectValues;
  const { backgroundPreset, backgroundFit } = editorBackground;
  const { backgroundMediaReady, backgroundAssetUrl } = editorTransientState;
  const {
    thumbnailCaptureRef,
    thumbnailCaptureKeyRef,
    backgroundVideo,
    backgroundImage,
    projectRef,
  } = editorRuntime;
  const { data } = editorEnvironment;
  useEffect(() => {
    if (
      !isDesktop() ||
      !project ||
      firstPhraseStart === null ||
      (["album-art", "image", "video"].includes(backgroundPreset) &&
        !backgroundMediaReady)
    ) {
      thumbnailCaptureRef.current = null;
      return;
    }
    const captureKey = [
      project.id,
      project.updatedAt,
      firstPhraseStart,
      backgroundAssetUrl,
    ].join(":");
    if (thumbnailCaptureKeyRef.current === captureKey) return;
    let disposed = false;
    const capture = async (allowAfterDispose = false) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (!context) return;

      if (backgroundPreset === "gradient") {
        const gradient = context.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(
          0,
          projectBackgroundTrack?.gradientStart ?? "#273660"
        );
        gradient.addColorStop(
          1,
          projectBackgroundTrack?.gradientEnd ?? "#0b1732"
        );
        context.fillStyle = gradient;
      } else {
        context.fillStyle = projectBackgroundTrack?.color ?? "#0b1732";
      }
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (backgroundPreset === "video" && backgroundVideo.current) {
        const video = backgroundVideo.current;
        // This is the same element used by the live preview. Seeking it to
        // capture a thumbnail races with timeline seeks and can leave Chromium's
        // decoder stuck, which also blocks navigation while capture is awaited.
        // Drawing the currently decoded frame keeps thumbnail creation isolated
        // from playback.
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
          drawMediaBackground(context, video, backgroundFit);
      }
      if (
        ["album-art", "image"].includes(backgroundPreset) &&
        backgroundImage.current
      ) {
        drawMediaBackground(context, backgroundImage.current, backgroundFit);
      }

      subtitleTracks
        .sort((left, right) => left.zIndex - right.zIndex)
        .forEach((track) => {
          const preview = subtitlePreviewView(track, firstPhraseStart);
          const phrase = preview.playingPhrase;
          if (!preview.visible || !phrase) return;
          const style = resolveSubtitleStyle(track.style, phrase.style);
          const x =
            canvas.width / 2 +
            (style.x / style.positionReferenceWidth) * canvas.width;
          const y =
            canvas.height * 0.5 +
            (style.y / style.positionReferenceHeight) * canvas.height;
          context.save();
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.font = `${style.fontStyle} ${style.fontWeight} ${Math.round(canvas.width * 0.03 * style.scale)}px ${subtitleFontStack(style.fontFamily)}`;
          context.lineJoin = "round";
          context.lineWidth = Math.max(2, canvas.width * 0.003);
          context.strokeStyle = "#000000";
          context.shadowColor = "#000000";
          context.shadowBlur = canvas.width * 0.01;
          context.strokeText(phrase.text, x, y);
          context.fillStyle = style.unreadColor;
          context.fillText(phrase.text, x, y);
          context.restore();
        });

      const thumbnail = await jpegBlob(canvas);
      if (!thumbnail || (disposed && !allowAfterDispose)) return;
      await saveProjectThumbnail(
        project.id,
        thumbnail,
        data.preferences.storageDirectory
      );
      thumbnailCaptureKeyRef.current = captureKey;
      const latestProject = projectRef.current;
      if (latestProject?.id === project.id) {
        const withThumbnail = { ...latestProject, thumbnail: "preview.jpg" };
        projectRef.current = withThumbnail;
      }
    };
    thumbnailCaptureRef.current = async () => {
      try {
        await capture(true);
      } catch (reason) {
        if (!disposed) setError(String(reason));
      }
    };
    return () => {
      disposed = true;
    };
  }, [
    backgroundAssetUrl,
    backgroundFit,
    backgroundMediaReady,
    backgroundPreset,
    data.preferences.storageDirectory,
    firstPhraseStart,
    project,
    projectBackgroundTrack,
    setError,
    subtitleTracks,
  ]);

  useLayoutEffect(
    () => () => {
      void thumbnailCaptureRef.current?.();
    },
    []
  );
  return {};
}

export type EditorThumbnail = ReturnType<typeof useEditorThumbnail>;
