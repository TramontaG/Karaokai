import {
  ArrowDown,
  ChevronDown,
  Clock3,
  Heart,
  LayoutGrid,
  List,
  Plus,
  UserRound,
} from "lucide-react";
import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import { EmptyProjects } from "./components/EmptyProjects";
import {
  CountBadge,
  FilterButton,
  Filters,
  Grid,
  HeaderCopy,
  ListHead,
  ListShell,
  NewProjectButton,
  Page,
  PageDescription,
  PageHeader,
  PageTitle,
  SortButton,
  SortControl,
  SortLabel,
  Toolbar,
  ViewButton,
  ViewControls,
  ViewSwitcher,
} from "./styles";

export function LibraryScreen() {
  const behavior = useBehavior({});

  return (
    <Page>
      <Render when={behavior.hasProjects}>
        <PageHeader>
          <HeaderCopy>
            <PageTitle>{behavior.title}</PageTitle>
            <PageDescription>{behavior.description}</PageDescription>
          </HeaderCopy>
          <NewProjectButton type="button" onClick={behavior.onNewProject}>
            <Plus aria-hidden="true" size={20} />
            {behavior.newProject}
          </NewProjectButton>
        </PageHeader>
        <Toolbar>
          <Filters aria-label={behavior.filterLabel}>
            <FilterButton
              type="button"
              aria-pressed={behavior.allActive}
              data-active={behavior.allActive}
              onClick={behavior.onShowAll}
            >
              {behavior.all}
              <CountBadge>{behavior.projectCount}</CountBadge>
            </FilterButton>
            <FilterButton
              type="button"
              aria-pressed={behavior.recentActive}
              data-active={behavior.recentActive}
              onClick={behavior.onShowRecent}
            >
              <Clock3 aria-hidden="true" size={16} />
              {behavior.recent}
            </FilterButton>
            <FilterButton
              type="button"
              aria-pressed={behavior.favoritesActive}
              data-active={behavior.favoritesActive}
              onClick={behavior.onShowFavorites}
            >
              <Heart aria-hidden="true" size={16} />
              {behavior.favorites}
            </FilterButton>
            <FilterButton
              type="button"
              aria-pressed={behavior.mineActive}
              data-active={behavior.mineActive}
              onClick={behavior.onShowMine}
            >
              <UserRound aria-hidden="true" size={16} />
              {behavior.mine}
            </FilterButton>
          </Filters>
          <ViewControls>
            <SortControl>
              <SortLabel>{behavior.sortLabel}</SortLabel>
              <SortButton type="button">
                {behavior.sortRecent}
                <ChevronDown aria-hidden="true" size={15} />
              </SortButton>
            </SortControl>
            <ViewSwitcher>
              <ViewButton
                type="button"
                aria-label={behavior.gridLabel}
                aria-pressed={behavior.gridActive}
                data-active={behavior.gridActive}
                onClick={behavior.onShowGrid}
              >
                <LayoutGrid aria-hidden="true" size={19} />
              </ViewButton>
              <ViewButton
                type="button"
                aria-label={behavior.listLabel}
                aria-pressed={behavior.listActive}
                data-active={behavior.listActive}
                onClick={behavior.onShowList}
              >
                <List aria-hidden="true" size={19} />
              </ViewButton>
            </ViewSwitcher>
          </ViewControls>
        </Toolbar>
        <Render when={behavior.gridActive}>
          <Grid>
            <ForEach
              data={behavior.visibleProjects}
              idCompute={behavior.getProjectId}
              render={behavior.renderGridProject}
            />
          </Grid>
        </Render>
        <Render when={behavior.listActive}>
          <ListShell role="table">
            <ListHead role="row">
              <span role="columnheader">{behavior.nameColumn}</span>
              <span role="columnheader">{behavior.artistColumn}</span>
              <span role="columnheader">{behavior.durationColumn}</span>
              <span role="columnheader">
                {behavior.updatedColumn}
                <ArrowDown aria-hidden="true" size={13} />
              </span>
              <span role="columnheader">{behavior.actionsColumn}</span>
            </ListHead>
            <ForEach
              data={behavior.visibleProjects}
              idCompute={behavior.getProjectId}
              render={behavior.renderListProject}
            />
          </ListShell>
        </Render>
      </Render>
      <Render when={behavior.hasNoProjects}>
        <EmptyProjects
          titlePrefix={behavior.emptyTitlePrefix}
          titleHighlight={behavior.emptyTitleHighlight}
          description={behavior.emptyDescription}
          localLabel={behavior.localLabel}
          privateLabel={behavior.privateLabel}
          unlimitedLabel={behavior.unlimitedLabel}
        />
      </Render>
    </Page>
  );
}
