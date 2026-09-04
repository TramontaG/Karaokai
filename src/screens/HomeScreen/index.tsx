import { ArrowRight } from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { ForEach } from "../../components/ForEach";
import { ImportPanel } from "../../components/ImportPanel";
import { useBehavior } from "./behavior";
import {
  Hero,
  HeroDescription,
  HeroTitle,
  Highlight,
  Page,
  ProjectGrid,
  RecentHeader,
  RecentSection,
  RecentTitle,
  ViewAll,
} from "./styles";

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
      <RecentSection>
        <RecentHeader>
          <RecentTitle>{behavior.recentProjectsTitle}</RecentTitle>
          <ViewAll to="/library">
            {behavior.viewAll}
            <ArrowRight aria-hidden="true" size={15} />
          </ViewAll>
        </RecentHeader>
        <ProjectGrid>
          <ForEach
            data={behavior.recentProjects}
            idCompute={behavior.getProjectId}
            render={behavior.renderProject}
          />
        </ProjectGrid>
      </RecentSection>
    </Page>
  );
}
