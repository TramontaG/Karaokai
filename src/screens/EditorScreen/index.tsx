import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import { DeleteTrackDialog } from "./components/DeleteTrackDialog";
import { ExportDialog } from "./components/ExportDialog";
import { EditorHeader } from "./components/EditorHeader";
import { EditorSidebar } from "./components/EditorSidebar";
import {
  EditorBehaviorProvider,
  EditorStateProvider,
} from "./components/EditorState";
import { EditorTimeline } from "./components/EditorTimeline";
import { PlayerControls } from "./components/PlayerControls";
import {
  EditorPage,
  PlayerError,
  RenderProgress,
  RenderProgressBar,
  PreviewArea,
  PreviewBackground,
  PreviewCanvas,
  Workspace,
} from "./styles";

export function EditorScreen() {
  return (
    <EditorStateProvider>
      <EditorScreenContent />
    </EditorStateProvider>
  );
}

function EditorScreenContent() {
  const behavior = useBehavior({});
  return (
    <EditorBehaviorProvider behavior={behavior}>
      <EditorPage>
        <EditorHeader />
        <Render when={behavior.renderProgress !== null}>
          <RenderProgress>
            <strong>
              {behavior.renderProgress?.status === "completed"
                ? behavior.exportCompletedLabel
                : behavior.renderProgress?.status === "failed"
                  ? behavior.exportFailedLabel
                  : behavior.exportRenderingLabel}
            </strong>
            <span>{behavior.renderProgress?.progress ?? 0}%</span>
            <RenderProgressBar
              $progress={behavior.renderProgress?.progress ?? 0}
            />
            <Render when={behavior.renderProgress?.status === "rendering"}>
              <button type="button" onClick={behavior.onCancelExport}>
                {behavior.exportCancelLabel}
              </button>
            </Render>
            <Render when={behavior.renderProgress?.status !== "rendering"}>
              <Render when={behavior.renderProgress?.error !== undefined}>
                <small>{behavior.renderProgress?.error}</small>
              </Render>
              <button type="button" onClick={behavior.onCancelExport}>
                {behavior.exportCloseLabel}
              </button>
            </Render>
          </RenderProgress>
        </Render>
        <Workspace>
          <audio
            ref={behavior.instrumentalAudio}
            src={behavior.instrumentalSource}
            preload="auto"
            onTimeUpdate={behavior.onInstrumentalTimeUpdate}
            onEnded={behavior.onPlaybackEnded}
            onError={behavior.onInstrumentalError}
            onCanPlay={behavior.onInstrumentalCanPlay}
          />
          <audio
            ref={behavior.vocalsAudio}
            src={behavior.vocalsSource}
            preload="auto"
          />
          <PreviewArea>
            <PreviewCanvas ref={behavior.previewCanvas}>
              <PreviewBackground style={behavior.backgroundStyle}>
                <Render
                  when={
                    behavior.backgroundPreset === "video" &&
                    behavior.backgroundAssetUrl !== null
                  }
                >
                  <video
                    ref={behavior.backgroundVideo}
                    src={behavior.backgroundAssetUrl ?? undefined}
                    loop
                    muted
                    playsInline
                    onLoadedMetadata={behavior.onBackgroundVideoLoadedMetadata}
                  />
                </Render>
                <Render
                  when={
                    ["album-art", "image"].includes(
                      behavior.backgroundPreset
                    ) && behavior.backgroundAssetUrl !== null
                  }
                >
                  <img
                    ref={behavior.backgroundImage}
                    src={behavior.backgroundAssetUrl ?? undefined}
                    alt=""
                    onLoad={behavior.onBackgroundImageLoaded}
                  />
                </Render>
              </PreviewBackground>
              <ForEach
                data={behavior.subtitlePreviews}
                idCompute={behavior.getSubtitlePreviewId}
                render={behavior.renderSubtitlePreview}
              />
              <Render when={behavior.error !== null}>
                <PlayerError>{behavior.error}</PlayerError>
              </Render>
            </PreviewCanvas>
          </PreviewArea>

          <PlayerControls />

          <EditorTimeline />
        </Workspace>

        <EditorSidebar />
        <Render when={behavior.trackDeleteDialogOpen}>
          <DeleteTrackDialog
            title={behavior.deleteTrackTitle}
            description={behavior.deleteTrackDescription}
            confirmLabel={behavior.deleteTrackConfirmLabel}
            cancelLabel={behavior.deleteTrackCancelLabel}
            closeLabel={behavior.deleteTrackCloseLabel}
            onConfirm={behavior.onConfirmDeleteTrack}
            onCancel={behavior.onCancelDeleteTrack}
          />
        </Render>
        <Render when={behavior.exportDialogOpen}>
          <ExportDialog
            title={behavior.exportTitle}
            description={behavior.exportDescription}
            advancedOptionsLabel={behavior.exportAdvancedOptionsLabel}
            resolutionLabel={behavior.exportResolutionLabel}
            fpsLabel={behavior.exportFpsLabel}
            audioLabel={behavior.exportAudioLabel}
            encodingPresetLabel={behavior.exportEncodingPresetLabel}
            encodingPresetNotice={behavior.exportEncodingPresetNotice}
            instrumentalLabel={behavior.instrumentalVolumeLabel}
            vocalsLabel={behavior.vocalsVolumeLabel}
            mixLabel={behavior.exportMixLabel}
            vocalsOnlyLabel={behavior.exportVocalsOnlyLabel}
            instrumentalOnlyLabel={behavior.exportInstrumentalOnlyLabel}
            cancelLabel={behavior.exportCancelLabel}
            confirmLabel={behavior.exportConfirmLabel}
            closeLabel={behavior.exportCloseLabel}
            resolution={behavior.exportResolution}
            fps={behavior.exportFps}
            audioMode={behavior.exportAudioMode}
            instrumentalVolume={behavior.exportInstrumentalVolume}
            vocalsVolume={behavior.exportVocalsVolume}
            encodingPreset={behavior.exportEncodingPreset}
            onResolutionChange={behavior.onExportResolutionChange}
            onFpsChange={behavior.onExportFpsChange}
            onAudioModeChange={behavior.onExportAudioModeChange}
            onInstrumentalVolumeChange={
              behavior.onExportInstrumentalVolumeChange
            }
            onVocalsVolumeChange={behavior.onExportVocalsVolumeChange}
            onEncodingPresetChange={behavior.onExportEncodingPresetChange}
            onCancel={behavior.onCloseExportDialog}
            onConfirm={() => void behavior.onStartExport()}
          />
        </Render>
      </EditorPage>
    </EditorBehaviorProvider>
  );
}
