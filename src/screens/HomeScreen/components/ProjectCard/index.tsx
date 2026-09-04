import { MoreVertical } from "lucide-react";
import { useBehavior, type ProjectCardProps } from "./behavior";
import {
  Card,
  Cover,
  Details,
  Duration,
  MenuButton,
  ProjectArtist,
  ProjectTitle,
} from "./styles";

export function ProjectCard(props: ProjectCardProps) {
  const behavior = useBehavior(props);

  return (
    <Card>
      <Cover $cover={behavior.cover}>
        <Duration>{behavior.duration}</Duration>
      </Cover>
      <Details>
        <div>
          <ProjectTitle>{behavior.title}</ProjectTitle>
          <ProjectArtist>{behavior.artist}</ProjectArtist>
        </div>
        <MenuButton type="button" aria-label={behavior.menuLabel}>
          <MoreVertical aria-hidden="true" size={18} />
        </MenuButton>
      </Details>
    </Card>
  );
}
