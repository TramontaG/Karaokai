import { Render } from "../../../../components/Render";
import { type ProjectCover } from "../../types";
import { useBehavior } from "./behavior";
import { Artwork, Duration } from "./styles";

export interface ProjectArtworkProps {
  projectId: string;
  cover: ProjectCover;
  thumbnail: string | null;
  duration: string;
  showDuration: boolean;
  compact: boolean;
}

export function ProjectArtwork(props: ProjectArtworkProps) {
  const behavior = useBehavior(props);
  return (
    <Artwork $cover={props.cover} $compact={props.compact}>
      <Render when={behavior.thumbnailUrl !== null}>
        <img src={behavior.thumbnailUrl ?? undefined} alt="" />
      </Render>
      <Render when={props.showDuration}>
        <Duration>{props.duration}</Duration>
      </Render>
    </Artwork>
  );
}
