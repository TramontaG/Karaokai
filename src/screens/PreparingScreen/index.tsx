import { LoaderCircle } from "lucide-react";
import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import {
  ActionButton,
  Description,
  Header,
  LyricsActions,
  LyricsDialog,
  LyricsError,
  LyricsForm,
  LyricsTextArea,
  TrackInput,
  LyricsPreview,
  PreparationPage,
  ProgressBar,
  ProgressFill,
  ProgressLabel,
  ProcessingNotice,
  StageList,
} from "./styles";

export function PreparingScreen() {
  const behavior = useBehavior({});
  return (
    <PreparationPage>
      <Header>
        <h1>{behavior.title}</h1>
        <Description>{behavior.description}</Description>
      </Header>
      <Render when={behavior.showTrackLoading}>
        <LyricsDialog role="status">
          <h2>{behavior.trackLoadingText}</h2>
        </LyricsDialog>
      </Render>
      <Render when={behavior.showMetadata}>
        <LyricsDialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-title"
        >
          <h2 id="track-title">{behavior.trackTitle}</h2>
          <p>{behavior.trackDescription}</p>
          <LyricsForm onSubmit={behavior.onConfirmTrack}>
            <label>
              {behavior.artistLabel}
              <TrackInput
                value={behavior.artist}
                onChange={behavior.onArtistChange}
                required
                maxLength={160}
              />
            </label>
            <label>
              {behavior.songLabel}
              <TrackInput
                value={behavior.song}
                onChange={behavior.onSongChange}
                required
                maxLength={160}
              />
            </label>
            <Render when={() => behavior.trackError !== null}>
              <LyricsError role="alert">{behavior.trackError}</LyricsError>
            </Render>
            <LyricsActions>
              <ActionButton type="submit">
                {behavior.confirmTrackLabel}
              </ActionButton>
            </LyricsActions>
          </LyricsForm>
        </LyricsDialog>
      </Render>
      <Render when={behavior.showLookupError}>
        <LyricsDialog
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="lookup-error-title"
        >
          <h2 id="lookup-error-title">{behavior.lookupErrorTitle}</h2>
          <LyricsError role="alert">{behavior.lookupErrorMessage}</LyricsError>
          <LyricsActions>
            <ActionButton type="button" onClick={behavior.onRetryLookup}>
              {behavior.retryLookupLabel}
            </ActionButton>
            <ActionButton type="button" onClick={behavior.onUseManualLyrics}>
              {behavior.manualLyricsLabel}
            </ActionButton>
          </LyricsActions>
        </LyricsDialog>
      </Render>
      <Render when={behavior.showNoLyrics}>
        <LyricsDialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-lyrics-title"
        >
          <h2 id="no-lyrics-title">{behavior.noLyricsTitle}</h2>
          <p>{behavior.noLyricsDescription}</p>
          <LyricsActions>
            <ActionButton type="button" onClick={behavior.onRetryLookup}>
              {behavior.retryLookupLabel}
            </ActionButton>
            <ActionButton type="button" onClick={behavior.onUseManualLyrics}>
              {behavior.manualLyricsLabel}
            </ActionButton>
          </LyricsActions>
        </LyricsDialog>
      </Render>
      <Render when={behavior.showLrclib}>
        <LyricsDialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="lrclib-title"
        >
          <h2 id="lrclib-title">{behavior.lrclibTitle}</h2>
          <p>{behavior.lrclibDescription}</p>
          <Render when={() => behavior.lrclibWarning !== null}>
            <LyricsError role="status">{behavior.lrclibWarning}</LyricsError>
          </Render>
          <LyricsPreview
            readOnly
            value={behavior.lrclibLyrics}
            aria-label={behavior.lrclibTitle}
            rows={12}
          />
          <Render when={() => behavior.lyricsError !== null}>
            <LyricsError role="alert">{behavior.lyricsError}</LyricsError>
          </Render>
          <LyricsActions>
            <ActionButton
              type="button"
              onClick={behavior.onAcceptLrclib}
              disabled={!behavior.canStartLrclib}
            >
              {behavior.acceptLrclibLabel}
            </ActionButton>
            <ActionButton type="button" onClick={behavior.onRejectLrclib}>
              {behavior.rejectLrclibLabel}
            </ActionButton>
          </LyricsActions>
        </LyricsDialog>
      </Render>
      <Render when={behavior.showProcessingNotice}>
        <ProcessingNotice role="status" aria-live="polite">
          <LoaderCircle aria-hidden="true" size={18} />
          {behavior.processingNotice}
        </ProcessingNotice>
      </Render>
      <Render when={behavior.awaitingLyrics}>
        <LyricsDialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="lyrics-title"
        >
          <h2 id="lyrics-title">{behavior.lyricsTitle}</h2>
          <p>{behavior.lyricsDescription}</p>
          <LyricsForm onSubmit={behavior.onStartTranscription}>
            <label>
              {behavior.lyricsFieldLabel}
              <LyricsTextArea
                value={behavior.lyrics}
                onChange={behavior.onLyricsChange}
                placeholder={behavior.lyricsPlaceholder}
                disabled={behavior.isStartingTranscription}
                rows={10}
              />
            </label>
            <Render when={() => behavior.lyricsError !== null}>
              <LyricsError role="alert">{behavior.lyricsError}</LyricsError>
            </Render>
            <LyricsActions>
              <ActionButton
                type="submit"
                disabled={behavior.isStartingTranscription}
              >
                {behavior.isStartingTranscription
                  ? behavior.lyricsStarting
                  : behavior.lyricsContinue}
              </ActionButton>
              <ActionButton
                type="submit"
                name="skipLyrics"
                value="true"
                disabled={behavior.isStartingTranscription}
              >
                {behavior.lyricsSkip}
              </ActionButton>
            </LyricsActions>
          </LyricsForm>
        </LyricsDialog>
      </Render>
      <ProgressBar aria-label={behavior.progressLabel}>
        <ProgressFill style={{ width: `${behavior.progress}%` }} />
      </ProgressBar>
      <ProgressLabel>{behavior.progressLabel}</ProgressLabel>
      <StageList>
        <ForEach
          data={behavior.stages}
          idCompute={behavior.getStageId}
          render={behavior.renderStage}
        />
      </StageList>
      <Render when={behavior.canRetryTranscription}>
        <ActionButton
          type="button"
          onClick={behavior.onRetryTranscription}
          disabled={behavior.isRetrying}
        >
          {behavior.isRetrying
            ? behavior.retryingTranscriptionLabel
            : behavior.retryTranscriptionLabel}
        </ActionButton>
        <Render when={() => behavior.retryError !== null}>
          <LyricsError role="alert">{behavior.retryError}</LyricsError>
        </Render>
      </Render>
      <Render when={behavior.canOpenEditor}>
        <ActionButton type="button" onClick={behavior.onOpenEditor}>
          {behavior.openEditor}
        </ActionButton>
      </Render>
    </PreparationPage>
  );
}
