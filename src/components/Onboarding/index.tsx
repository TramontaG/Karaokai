import { ForEach } from "../ForEach";
import { Render } from "../Render";
import { Minus, Moon, Square, Sun, X } from "lucide-react";
import { ModelOption } from "./components/ModelOption";
import { useBehavior } from "./behavior";
import {
  Action,
  Actions,
  Card,
  ErrorMessage,
  Header,
  HeaderThemeButton,
  ModelList,
  Progress,
  ProgressBar,
  StorageSpinner,
  StorageTransition,
  Subtitle,
  Title,
  WindowAction,
  WindowActions,
  Wrapper,
} from "./styles";

export function Onboarding() {
  const behavior = useBehavior({});

  return (
    <Wrapper>
      <Header>
        <HeaderThemeButton
          type="button"
          aria-label={behavior.themeLabel}
          onClick={behavior.onToggleTheme}
        >
          <Render when={behavior.isDarkTheme}>
            <Moon aria-hidden="true" size={19} />
          </Render>
          <Render when={behavior.isLightTheme}>
            <Sun aria-hidden="true" size={19} />
          </Render>
        </HeaderThemeButton>
        <WindowActions>
          <WindowAction
            type="button"
            aria-label={behavior.minimizeLabel}
            onClick={behavior.onMinimize}
          >
            <Minus aria-hidden="true" size={18} />
          </WindowAction>
          <WindowAction
            type="button"
            aria-label={behavior.maximizeLabel}
            onClick={behavior.onToggleMaximize}
          >
            <Square aria-hidden="true" size={15} />
          </WindowAction>
          <WindowAction
            type="button"
            aria-label={behavior.closeLabel}
            onClick={behavior.onClose}
          >
            <X aria-hidden="true" size={19} />
          </WindowAction>
        </WindowActions>
      </Header>
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
          <Render when={behavior.isStoragePreparing}>
            <StorageTransition aria-live="polite" role="status">
              <StorageSpinner aria-hidden="true" />
              <div>
                <strong>{behavior.storagePreparingTitle}</strong>
                <span>{behavior.storagePreparingDescription}</span>
              </div>
            </StorageTransition>
          </Render>
          <Render when={() => !behavior.isStoragePreparing}>
            <Actions>
              <Action onClick={behavior.useDefaultStorage}>
                {behavior.useDefaultStorageLabel}
              </Action>
              <Action onClick={behavior.chooseStorageDirectory}>
                {behavior.chooseStorageLabel}
              </Action>
            </Actions>
          </Render>
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
