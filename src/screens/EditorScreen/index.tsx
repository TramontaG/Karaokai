import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import { DeleteTrackDialog } from "./components/DeleteTrackDialog";
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
            <PreviewCanvas>
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
      </EditorPage>
    </EditorBehaviorProvider>
  );
}
