import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import {
  ActionButton,
  Description,
  Header,
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
