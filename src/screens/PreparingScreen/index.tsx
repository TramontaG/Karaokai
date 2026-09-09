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
  PreparationPage,
  ProgressBar,
  ProgressFill,
  ProgressLabel,
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
      <Render when={behavior.hasFailed}>
        <ActionButton type="button" onClick={behavior.onOpenEditor}>
          {behavior.openEditor}
        </ActionButton>
      </Render>
    </PreparationPage>
  );
}
