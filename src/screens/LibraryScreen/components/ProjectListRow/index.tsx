import { MoreVertical, Star } from "lucide-react";
import { Render } from "../../../../components/Render";
import { ProjectActionsMenu } from "../ProjectActionsMenu";
import { ProjectArtwork } from "../ProjectArtwork";
import { useBehavior, type ProjectListRowProps } from "./behavior";
import {
  Actions,
  ActionsCell,
  FavoriteIcon,
  MenuButton,
  NameCell,
  ProjectArtist,
  ProjectDuration,
  ProjectName,
  ProjectUpdated,
  Row,
  TitleLine,
} from "./styles";

export function ProjectListRow(props: ProjectListRowProps) {
  const behavior = useBehavior(props);

  return (
    <Row role="row">
      <NameCell role="cell">
        <ProjectArtwork
          cover={behavior.cover}
          duration={behavior.duration}
          showDuration={false}
          compact
        />
        <TitleLine>
          <ProjectName>{behavior.title}</ProjectName>
          <FavoriteIcon
            type="button"
            aria-label={behavior.favoriteButtonLabel}
            $active={behavior.isFavorite}
            onClick={behavior.onToggleFavorite}
          >
            <Star aria-hidden="true" size={16} fill={behavior.favoriteFill} />
          </FavoriteIcon>
        </TitleLine>
      </NameCell>
      <ProjectArtist role="cell">{behavior.artist}</ProjectArtist>
      <ProjectDuration role="cell">{behavior.duration}</ProjectDuration>
      <ProjectUpdated role="cell">{behavior.updated}</ProjectUpdated>
      <ActionsCell role="cell">
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
      </ActionsCell>
    </Row>
  );
}
