import { Link, Outlet } from "@tanstack/react-router";
import {
  Folder,
  Home,
  Minus,
  Moon,
  PanelsTopLeft,
  Search,
  Settings,
  Square,
  Sun,
  X,
} from "lucide-react";
import { BrandMark } from "../BrandMark";
import { Render } from "../Render";
import { useBehavior } from "./behavior";
import {
  Brand,
  BrandAccent,
  BrandName,
  Content,
  EditorTab,
  Navigation,
  ProjectNavigationLabel,
  SearchBox,
  SearchInput,
  Shell,
  Sidebar,
  ThemeButton,
  Titlebar,
  WindowAction,
  WindowActions,
  Workspace,
} from "./styles";

export function AppLayout() {
  const behavior = useBehavior({});

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <BrandMark size={40} />
          <BrandName>
            {behavior.brandName}
            <BrandAccent>{behavior.brandAccent}</BrandAccent>
          </BrandName>
        </Brand>
        <Navigation aria-label={behavior.navigationLabel}>
          <Link to="/" onClick={behavior.onNavigateHome}>
            <Home aria-hidden="true" size={22} />
            {behavior.home}
          </Link>
          <Link to="/library" onClick={behavior.onNavigateLibrary}>
            <Folder aria-hidden="true" size={22} />
            {behavior.library}
          </Link>
          <Render when={behavior.editorProjectId !== null}>
            <Link
              to="/projects/$projectId/editor"
              params={{ projectId: behavior.editorProjectId ?? "" }}
              aria-label={behavior.editorLabel}
              title={behavior.editorLabel}
            >
              <PanelsTopLeft aria-hidden="true" size={22} />
              <ProjectNavigationLabel>{behavior.editor}</ProjectNavigationLabel>
            </Link>
          </Render>
          <Render when={behavior.editorProjectId === null}>
            <EditorTab aria-disabled="true" title={behavior.editorLabel}>
              <PanelsTopLeft aria-hidden="true" size={22} />
              {behavior.editor}
            </EditorTab>
          </Render>
          <Link to="/settings" onClick={behavior.onNavigateSettings}>
            <Settings aria-hidden="true" size={22} />
            {behavior.settings}
          </Link>
        </Navigation>
      </Sidebar>
      <Workspace data-editor={behavior.isEditorRoute}>
        <Titlebar data-editor={behavior.isEditorRoute}>
          <Render when={!behavior.isEditorRoute}>
            <SearchBox>
              <Search aria-hidden="true" size={18} />
              <SearchInput
                aria-label={behavior.searchLabel}
                type="search"
                placeholder={behavior.searchPlaceholder}
              />
            </SearchBox>
          </Render>
          <Render when={!behavior.isEditorRoute}>
            <ThemeButton
              type="button"
              aria-label={behavior.themeLabel}
              onClick={behavior.onToggleTheme}
            >
              <Render when={behavior.isDarkTheme}>
                <Moon aria-hidden="true" size={19} />
              </Render>
              <Render when={behavior.isLightTheme}>
                <Sun aria-hidden="true" size={19} />
              </Render>
            </ThemeButton>
          </Render>
          <Render when={!behavior.isEditorRoute}>
            <WindowActions>
              <WindowAction
                type="button"
                aria-label={behavior.minimizeLabel}
                onClick={behavior.onMinimize}
              >
                <Minus aria-hidden="true" size={18} />
              </WindowAction>
              <WindowAction
                type="button"
                aria-label={behavior.maximizeLabel}
                onClick={behavior.onToggleMaximize}
              >
                <Square aria-hidden="true" size={15} />
              </WindowAction>
              <WindowAction
                type="button"
                aria-label={behavior.closeLabel}
                onClick={behavior.onClose}
              >
                <X aria-hidden="true" size={19} />
              </WindowAction>
            </WindowActions>
          </Render>
        </Titlebar>
        <Content data-editor={behavior.isEditorRoute}>
          <Outlet />
        </Content>
      </Workspace>
    </Shell>
  );
}
