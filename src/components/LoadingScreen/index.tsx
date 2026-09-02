import { useBehavior } from "./behavior";
import { Container, Label } from "./styles";

export function LoadingScreen() {
  const { label } = useBehavior({});

  return (
    <Container>
      <Label>{label}</Label>
    </Container>
  );
}
