import { useBehavior } from "./behavior";
import { Action, Card, Description, Header, Meta, Title } from "./styles";

export function ModelsScreen() {
  const behavior = useBehavior({});
  return (
    <>
      <Header>{behavior.pageTitle}</Header>
      <Card>
        <Meta>{behavior.model.category}</Meta>
        <Title>{behavior.model.name}</Title>
        <Description>{behavior.model.sizeLabel}</Description>
        <Action
          disabled={behavior.actionDisabled}
          onClick={behavior.onDownload}
        >
          {behavior.actionLabel}
        </Action>
      </Card>
    </>
  );
}
