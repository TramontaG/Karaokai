import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { Profiler, useRef, type ReactNode } from "react";
import { useBehavior } from "./behavior";
import { DeleteTrackDialog } from "./components/DeleteTrackDialog";
import { ExportDialog } from "./components/ExportDialog";
import { ExportProgressDialog } from "./components/ExportProgressDialog";
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
  PreviewArea,
  PreviewBackground,
  PreviewCanvas,
  Workspace,
} from "./styles";

const PLAYBACK_PROFILER_STORAGE_KEY = "karaokai.debug.playback-profiler";

function PlaybackPreviewProfiler({ children }: { children: ReactNode }) {
  const samples = useRef({
    startedAt: performance.now(),
    commits: 0,
    totalRender: 0,
    maximumRender: 0,
  });
  return (
    <Profiler
      id="editor-preview"
      onRender={(_id, _phase, actualDuration) => {
        if (
          window.localStorage.getItem(PLAYBACK_PROFILER_STORAGE_KEY) !== "true"
        )
          return;
        const sample = samples.current;
        sample.commits += 1;
        sample.totalRender += actualDuration;
        sample.maximumRender = Math.max(sample.maximumRender, actualDuration);
        const now = performance.now();
        if (now - sample.startedAt < 1_000) return;
        console.table({
          reactPreviewCommits: sample.commits,
          reactPreviewAverageMs: Number(
            (sample.totalRender / sample.commits).toFixed(2)
          ),
          reactPreviewMaximumMs: Number(sample.maximumRender.toFixed(2)),
        });
        samples.current = {
          startedAt: now,
          commits: 0,
          totalRender: 0,
          maximumRender: 0,
        };
      }}
    >
      {children}
    </Profiler>
  );
}

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
          <ExportProgressDialog
            Icon={behavior.renderProgressIcon}
            status={behavior.renderProgress?.status ?? "rendering"}
            title={behavior.renderProgressTitle}
            progress={behavior.renderProgress?.progress ?? 0}
            error={behavior.renderProgress?.error}
            cancelling={behavior.isCancellingExport}
            cancelLabel={behavior.exportCancelLabel}
            closeLabel={behavior.exportCloseLabel}
            onCancel={() => void behavior.onCancelExport()}
          />
        </Render>
        <Workspace>
          <audio
            ref={behavior.instrumentalAudio}
            src={behavior.instrumentalSource}
            preload="auto"
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
            <PlaybackPreviewProfiler>
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
                      onLoadedMetadata={
                        behavior.onBackgroundVideoLoadedMetadata
                      }
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
            </PlaybackPreviewProfiler>
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
