import { ForEach } from "../ForEach";
import { Render } from "../Render";
import { ModelOption } from "./components/ModelOption";
import { useBehavior } from "./behavior";
import {
  Action,
  Card,
  ErrorMessage,
  ModelList,
  Progress,
  ProgressBar,
  Subtitle,
  Title,
  Wrapper,
} from "./styles";

export function Onboarding() {
  const behavior = useBehavior({});

  return (
    <Wrapper>
      <Render when={behavior.isWelcome}>
        <Card>
          <Title>{behavior.welcomeTitle}</Title>
          <Subtitle>{behavior.welcomeDescription}</Subtitle>
          <Action onClick={behavior.getStarted}>
            {behavior.getStartedLabel}
          </Action>
        </Card>
      </Render>
      <Render when={behavior.isStorage}>
        <Card>
          <Title>{behavior.storageTitle}</Title>
          <Subtitle>{behavior.storageDescription}</Subtitle>
          <Subtitle>{behavior.storagePath}</Subtitle>
          <Action onClick={behavior.useDefaultStorage}>
            {behavior.useDefaultStorageLabel}
          </Action>
          <Action onClick={behavior.chooseStorageDirectory}>
            {behavior.chooseStorageLabel}
          </Action>
          <Render when={behavior.hasError}>
            <ErrorMessage>{behavior.errorMessage}</ErrorMessage>
          </Render>
        </Card>
      </Render>
      <Render when={behavior.isModels}>
        <Card>
          <Title>{behavior.modelsTitle}</Title>
          <Subtitle>{behavior.modelsDescription}</Subtitle>
          <ModelList>
            <ForEach
              data={behavior.modelOptions}
              idCompute={behavior.modelId}
              render={behavior.renderModel}
            />
          </ModelList>
          <Action
            disabled={behavior.downloadDisabled}
            onClick={behavior.download}
          >
            {behavior.downloadLabel}
          </Action>
        </Card>
      </Render>
      <Render when={behavior.isDownloading}>
        <Card>
          <Title>{behavior.downloadingTitle}</Title>
          <Subtitle>{behavior.downloadingDescription}</Subtitle>
          <Render when={behavior.hasStatusMessage}>
            <Subtitle>{behavior.statusMessage}</Subtitle>
          </Render>
          <Progress>
            <ProgressBar
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={behavior.progress}
              progress={behavior.progress}
              role="progressbar"
            />
          </Progress>
          <Subtitle>{behavior.progressLabel}</Subtitle>
          <Render when={behavior.hasProgressDetails}>
            <Subtitle>{behavior.progressDetails}</Subtitle>
          </Render>
          <Render when={behavior.hasError}>
            <ErrorMessage>{behavior.errorMessage}</ErrorMessage>
            <Render when={behavior.canRetryDownload}>
              <Action onClick={behavior.download}>{behavior.retryLabel}</Action>
            </Render>
          </Render>
        </Card>
      </Render>
      <Render when={behavior.isSuccess}>
        <Card>
          <Title>{behavior.successTitle}</Title>
          <Subtitle>{behavior.successDescription}</Subtitle>
          <Action onClick={behavior.finish}>{behavior.finishLabel}</Action>
        </Card>
      </Render>
    </Wrapper>
  );
}
