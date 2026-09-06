import { BrandMark } from "../../components/BrandMark";
import { ImportPanel } from "../../components/ImportPanel";
import { useBehavior } from "./behavior";
import { Hero, HeroDescription, HeroTitle, Highlight, Page } from "./styles";

export function HomeScreen() {
  const behavior = useBehavior({});

  return (
    <Page>
      <Hero>
        <BrandMark size={58} />
        <HeroTitle>
          {behavior.titlePrefix}
          <Highlight>{behavior.titleHighlight}</Highlight>
        </HeroTitle>
        <HeroDescription>{behavior.description}</HeroDescription>
      </Hero>
      <ImportPanel />
    </Page>
  );
}
