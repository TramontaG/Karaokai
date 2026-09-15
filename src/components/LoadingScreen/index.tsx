import { useBehavior } from "./behavior";
import {
  Container,
  Detail,
  ErrorDetails,
  Label,
  Progress,
  RetryButton,
} from "./styles";

export function LoadingScreen() {
  const behavior = useBehavior({});

  return (
    <Container>
      <section>
        <Label>{behavior.label}</Label>
        {behavior.detail ? (
          <Detail>
            {behavior.detail}
            {behavior.progress !== null ? ` (${behavior.progress}%)` : ""}
          </Detail>
        ) : null}
        {behavior.error ? (
          <ErrorDetails role="alert">{behavior.error}</ErrorDetails>
        ) : null}
        {behavior.error ? (
          <RetryButton type="button" onClick={behavior.retry}>
            {behavior.retryLabel}
          </RetryButton>
        ) : null}
        {behavior.progress !== null ? (
          <Progress value={behavior.progress} max={100} />
        ) : null}
      </section>
    </Container>
  );
}
