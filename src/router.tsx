import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { EditorScreen } from "./screens/EditorScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
const root = createRootRoute({ component: AppLayout });
const home = createRoute({
  getParentRoute: () => root,
  path: "/",
  component: HomeScreen,
});
const library = createRoute({
  getParentRoute: () => root,
  path: "/library",
  component: LibraryScreen,
});
const editor = createRoute({
  getParentRoute: () => root,
  path: "/projects/$projectId/editor",
  component: EditorScreen,
});
const settings = createRoute({
  getParentRoute: () => root,
  path: "/settings",
  component: SettingsScreen,
});
export const router = createRouter({
  routeTree: root.addChildren([home, library, editor, settings]),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
