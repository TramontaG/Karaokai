import type { EditorBackground } from "./useEditorBackground";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorMedia } from "./useEditorMedia";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorRuntime: Pick<EditorRuntime, "backgroundVideo" | "backgroundImage">;
  editorBackground: Pick<
    EditorBackground,
    | "onBackgroundImageLoaded"
    | "backgroundPreset"
    | "backgroundAsset"
    | "backgroundAssetName"
    | "backgroundFit"
    | "backgroundStyle"
    | "onBackgroundPresetChange"
    | "onBackgroundAssetImport"
    | "updateBackground"
  >;
  editorProjectValues: Pick<
    EditorProjectValues,
    "backgroundTrack" | "projectBackgroundTrack"
  >;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  editorTransientState: Pick<EditorTransientState, "backgroundAssetUrl">;
  editorMedia: Pick<EditorMedia, "onBackgroundVideoLoadedMetadata">;
}

export function useEditorBackgroundView({
  editorRuntime,
  editorBackground,
  editorProjectValues,
  editorEnvironment,
  editorTransientState,
  editorMedia,
}: Options) {
  const { backgroundVideo, backgroundImage } = editorRuntime;
  const {
    onBackgroundImageLoaded,
    backgroundPreset,
    backgroundAsset,
    backgroundAssetName,
    backgroundFit,
    backgroundStyle,
    onBackgroundPresetChange,
    onBackgroundAssetImport,
    updateBackground,
  } = editorBackground;
  const { backgroundTrack, projectBackgroundTrack } = editorProjectValues;
  const { t } = editorEnvironment;
  const { backgroundAssetUrl } = editorTransientState;
  const { onBackgroundVideoLoadedMetadata } = editorMedia;
  return {
    backgroundVideo,
    backgroundImage,
    onBackgroundImageLoaded,
    backgroundTrackSelected: backgroundTrack !== null,
    backgroundPreset,
    backgroundAsset,
    backgroundAssetName,
    backgroundFit,
    backgroundColor: projectBackgroundTrack?.color ?? "#0B1732",
    backgroundGradientStart: projectBackgroundTrack?.gradientStart ?? "#273660",
    backgroundGradientEnd: projectBackgroundTrack?.gradientEnd ?? "#0B1732",
    backgroundGradientAngle: projectBackgroundTrack?.gradientAngle ?? 135,
    backgroundPresetLabel: t("editor.backgroundPreset"),
    backgroundAlbumArtLabel: t("editor.background.albumArt"),
    backgroundVideoLabel: t("editor.background.video"),
    backgroundImageLabel: t("editor.background.image"),
    backgroundSolidLabel: t("editor.background.solid"),
    backgroundGradientLabel: t("editor.background.gradient"),
    backgroundChooseLabel: t("editor.background.choose"),
    backgroundReplaceLabel: t("editor.background.replace"),
    backgroundSelectedFileLabel: t("editor.background.selectedFile", {
      file: backgroundAssetName ?? "",
    }),
    backgroundFitLabel: t("editor.background.fit"),
    backgroundColorLabel: t("editor.background.color"),
    backgroundGradientStartLabel: t("editor.background.gradientStart"),
    backgroundGradientEndLabel: t("editor.background.gradientEnd"),
    backgroundGradientAngleLabel: t("editor.background.gradientAngle"),
    backgroundAssetUrl,
    backgroundStyle,
    backgroundClipLabel: t("editor.track.background"),
    onBackgroundVideoLoadedMetadata,
    onBackgroundPresetChange,
    onBackgroundAssetImport,
    onBackgroundChange: updateBackground,
  };
}

export type EditorBackgroundView = ReturnType<typeof useEditorBackgroundView>;
