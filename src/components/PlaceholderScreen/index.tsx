import { Container, Description, Title } from "./styles";

export interface PlaceholderProps {
  title: string;
  description: string;
}

export function PlaceholderScreen(props: PlaceholderProps) {
  const { description, title } = props;

  return (
    <Container>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Container>
  );
}
