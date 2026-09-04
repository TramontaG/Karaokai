import { Link, Outlet } from "@tanstack/react-router";
import {
  Folder,
  Home,
  Minus,
  Moon,
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
  Navigation,
  ResizeHandle,
  SearchBox,
  SearchInput,
  Shell,
  Sidebar,
  SidebarFooter,
  StorageDescription,
  StorageLabel,
  StorageLine,
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
      <ResizeHandle
        aria-hidden="true"
        data-direction="North"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="NorthEast"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="East"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="SouthEast"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="South"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="SouthWest"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="West"
        onMouseDown={behavior.onStartResize}
      />
      <ResizeHandle
        aria-hidden="true"
        data-direction="NorthWest"
        onMouseDown={behavior.onStartResize}
      />
      <Sidebar>
        <Brand>
          <BrandMark size={40} />
          <BrandName>
            {behavior.brandName}
            <BrandAccent>{behavior.brandAccent}</BrandAccent>
          </BrandName>
        </Brand>
        <Navigation aria-label={behavior.navigationLabel}>
          <Link to="/">
            <Home aria-hidden="true" size={22} />
            {behavior.home}
          </Link>
          <Link to="/library">
            <Folder aria-hidden="true" size={22} />
            {behavior.library}
          </Link>
          <Link to="/settings">
            <Settings aria-hidden="true" size={22} />
            {behavior.settings}
          </Link>
        </Navigation>
        <SidebarFooter>
          <StorageLabel>{behavior.storageLabel}</StorageLabel>
          <StorageDescription>{behavior.storageDescription}</StorageDescription>
          <StorageLine />
        </SidebarFooter>
      </Sidebar>
      <Workspace>
        <Titlebar onMouseDown={behavior.onStartDragging}>
          <SearchBox>
            <Search aria-hidden="true" size={18} />
            <SearchInput
              aria-label={behavior.searchLabel}
              type="search"
              placeholder={behavior.searchPlaceholder}
            />
          </SearchBox>
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
        </Titlebar>
        <Content>
          <Outlet />
        </Content>
      </Workspace>
    </Shell>
  );
}
