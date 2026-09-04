import { Render } from "../../../../components/Render";
import { type ProjectCover } from "../../types";
import { Artwork, Duration } from "./styles";

export interface ProjectArtworkProps {
  cover: ProjectCover;
  duration: string;
  showDuration: boolean;
  compact: boolean;
}

export function ProjectArtwork(props: ProjectArtworkProps) {
  return (
    <Artwork $cover={props.cover} $compact={props.compact}>
      <Render when={props.showDuration}>
        <Duration>{props.duration}</Duration>
      </Render>
    </Artwork>
  );
}
