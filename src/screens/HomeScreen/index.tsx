import { useBehavior } from "./behavior";
import { Description, Title } from "./styles";
export function HomeScreen() {
  const behavior = useBehavior({});
  return (
    <>
      <Title>{behavior.title}</Title>
      <Description>{behavior.description}</Description>
    </>
  );
}
