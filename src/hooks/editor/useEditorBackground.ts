import { useCallback, useEffect, type CSSProperties } from "react";
import {
  type BackgroundPreset,
  type BackgroundTrack,
} from "../../domain/project";
import { chooseBackgroundFile } from "../../services/desktop";
import {
  extractAlbumArt,
  importBackgroundAsset,
  readProjectAsset,
} from "../../services/projects";
import { albumArtError } from "../../services/userFacingErrors";
import {
  backgroundMimeType,
  isVideoBackgroundAsset,
} from "../../util/editor/media";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorErrors } from "./useEditorErrors";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorProjectValues: Pick<
    EditorProjectValues,
    "projectBackgroundTrack" | "backgroundTrack"
  >;
  editorTransientState: Pick<
    EditorTransientState,
    "setBackgroundAssetUrl" | "setBackgroundMediaReady"
  >;
  editorEnvironment: Pick<EditorEnvironment, "projectId" | "data" | "t">;
  editorDataState: Pick<EditorDataState, "setError">;
  editorRuntime: Pick<EditorRuntime, "projectRef">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  editorErrors: Pick<EditorErrors, "showTemporaryError">;
}

export function useEditorBackground({
  editorProjectValues,
  editorTransientState,
  editorEnvironment,
  editorDataState,
  editorRuntime,
  editorHistory,
  editorErrors,
}: Options) {
  const { projectBackgroundTrack, backgroundTrack } = editorProjectValues;
  const { setBackgroundAssetUrl, setBackgroundMediaReady } =
    editorTransientState;
  const { projectId, data, t } = editorEnvironment;
  const { setError } = editorDataState;
  const { projectRef } = editorRuntime;
  const { persistProject } = editorHistory;
  const { showTemporaryError } = editorErrors;
  const backgroundPreset = projectBackgroundTrack?.preset ?? "solid";

  const legacyBackgroundAsset = projectBackgroundTrack?.asset ?? null;

  const backgroundAsset =
    backgroundPreset === "video"
      ? (projectBackgroundTrack?.videoAsset ??
        (legacyBackgroundAsset && isVideoBackgroundAsset(legacyBackgroundAsset)
          ? legacyBackgroundAsset
          : null))
      : backgroundPreset === "image"
        ? (projectBackgroundTrack?.imageAsset ??
          (legacyBackgroundAsset &&
          !isVideoBackgroundAsset(legacyBackgroundAsset)
            ? legacyBackgroundAsset
            : null))
        : backgroundPreset === "album-art"
          ? legacyBackgroundAsset
          : null;

  const backgroundAssetName =
    backgroundPreset === "video"
      ? (projectBackgroundTrack?.videoAssetName ??
        (backgroundAsset === legacyBackgroundAsset
          ? projectBackgroundTrack?.assetName
          : undefined) ??
        backgroundAsset)
      : backgroundPreset === "image"
        ? (projectBackgroundTrack?.imageAssetName ??
          (backgroundAsset === legacyBackgroundAsset
            ? projectBackgroundTrack?.assetName
            : undefined) ??
          backgroundAsset)
        : null;

  const backgroundFit = projectBackgroundTrack?.fit ?? "cover";

  const backgroundStyle = {
    background:
      backgroundPreset === "gradient"
        ? `linear-gradient(${projectBackgroundTrack?.gradientAngle ?? 135}deg, ${projectBackgroundTrack?.gradientStart ?? "#273660"}, ${projectBackgroundTrack?.gradientEnd ?? "#0b1732"})`
        : (projectBackgroundTrack?.color ?? "#0b1732"),
    "--background-fit": backgroundFit,
  } as CSSProperties;

  useEffect(() => {
    if (
      !backgroundAsset ||
      !["album-art", "image", "video"].includes(backgroundPreset)
    ) {
      setBackgroundAssetUrl(null);
      setBackgroundMediaReady(false);
      return;
    }
    let disposed = false;
    let url: string | null = null;
    setBackgroundMediaReady(false);
    void readProjectAsset(
      projectId,
      backgroundAsset,
      data.preferences.storageDirectory
    )
      .then((bytes) => {
        if (disposed) return;
        url = URL.createObjectURL(
          new Blob([bytes], { type: backgroundMimeType(backgroundAsset) })
        );
        setBackgroundAssetUrl(url);
      })
      .catch((reason) => setError(String(reason)));
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [
    backgroundAsset,
    backgroundAssetName,
    backgroundPreset,
    data.preferences.storageDirectory,
    projectId,
  ]);

  const updateBackground = useCallback(
    (patch: Partial<BackgroundTrack>) => {
      const currentProject = projectRef.current;
      if (!currentProject || !backgroundTrack) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.id === backgroundTrack.id ? { ...track, ...patch } : track
        ),
      });
    },
    [backgroundTrack, persistProject]
  );

  const onBackgroundPresetChange = useCallback(
    async (preset: BackgroundPreset) => {
      if (!backgroundTrack) return;
      if (preset === "album-art") {
        try {
          const asset = await extractAlbumArt(
            projectId,
            data.preferences.storageDirectory
          );
          updateBackground({ preset, asset, fit: "cover" });
        } catch (reason) {
          showTemporaryError(
            t(`editor.background.error.${albumArtError(reason)}`)
          );
        }
        return;
      }
      updateBackground({ preset });
    },
    [
      backgroundTrack,
      data.preferences.storageDirectory,
      projectId,
      showTemporaryError,
      t,
      updateBackground,
    ]
  );

  const onBackgroundAssetImport = useCallback(
    async (kind: "image" | "video") => {
      if (!backgroundTrack) return;
      try {
        const sourcePath = await chooseBackgroundFile(kind);
        if (!sourcePath) return;
        const asset = await importBackgroundAsset(
          projectId,
          sourcePath,
          kind,
          data.preferences.storageDirectory
        );
        updateBackground({
          preset: kind,
          ...(kind === "video"
            ? {
                videoAsset: asset,
                videoAssetName: sourcePath.split(/[\\/]/).pop() ?? asset,
              }
            : {
                imageAsset: asset,
                imageAssetName: sourcePath.split(/[\\/]/).pop() ?? asset,
              }),
          fit: "cover",
        });
      } catch (reason) {
        setError(String(reason));
      }
    },
    [
      backgroundTrack,
      data.preferences.storageDirectory,
      projectId,
      updateBackground,
    ]
  );

  const onBackgroundImageLoaded = useCallback(
    () => setBackgroundMediaReady(true),
    []
  );
  return {
    backgroundPreset,
    backgroundFit,
    onBackgroundImageLoaded,
    backgroundAsset,
    backgroundAssetName,
    backgroundStyle,
    onBackgroundPresetChange,
    onBackgroundAssetImport,
    updateBackground,
  };
}

export type EditorBackground = ReturnType<typeof useEditorBackground>;
