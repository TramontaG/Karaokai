import { Heart, MoreVertical } from "lucide-react";
import { Render } from "../../../../components/Render";
import { ProjectActionsMenu } from "../ProjectActionsMenu";
import { ProjectArtwork } from "../ProjectArtwork";
import { useBehavior, type ProjectGridCardProps } from "./behavior";
import {
  Actions,
  Card,
  CardBody,
  FavoriteButton,
  MenuButton,
  ProjectArtist,
  ProjectTitle,
  ProjectUpdated,
} from "./styles";

export function ProjectGridCard(props: ProjectGridCardProps) {
  const behavior = useBehavior(props);

  return (
    <Card>
      <ProjectArtwork
        cover={behavior.cover}
        duration={behavior.duration}
        showDuration
        compact={false}
      />
      <CardBody>
        <ProjectTitle>{behavior.title}</ProjectTitle>
        <ProjectArtist>{behavior.artist}</ProjectArtist>
        <ProjectUpdated>{behavior.updated}</ProjectUpdated>
        <Actions data-project-actions>
          <MenuButton
            type="button"
            aria-label={behavior.actionsButtonLabel}
            aria-expanded={behavior.actionsOpen}
            onClick={behavior.onMenuClick}
          >
            <MoreVertical aria-hidden="true" size={17} />
          </MenuButton>
          <Render when={behavior.actionsOpen}>
            <ProjectActionsMenu
              label={behavior.menuLabel}
              openLabel={behavior.openLabel}
              renameLabel={behavior.renameLabel}
              favoriteLabel={behavior.favoriteLabel}
              duplicateLabel={behavior.duplicateLabel}
              exportLabel={behavior.exportLabel}
              openFolderLabel={behavior.openFolderLabel}
              deleteLabel={behavior.deleteLabel}
              onOpen={behavior.onOpen}
              onRename={behavior.onRename}
              onToggleFavorite={behavior.onToggleFavorite}
              onDuplicate={behavior.onDuplicate}
              onExport={behavior.onExport}
              onOpenFolder={behavior.onOpenFolder}
              onDelete={behavior.onDelete}
            />
          </Render>
        </Actions>
        <FavoriteButton
          type="button"
          aria-label={behavior.favoriteButtonLabel}
          $active={behavior.isFavorite}
          onClick={behavior.onToggleFavorite}
        >
          <Heart aria-hidden="true" size={17} fill={behavior.favoriteFill} />
        </FavoriteButton>
      </CardBody>
    </Card>
  );
}
