import { Link, Outlet } from "@tanstack/react-router";
import { useBehavior } from "./behavior";
import { Content, Navigation, Shell, Sidebar } from "./styles";
export function AppLayout() {
  const behavior = useBehavior({});
  return (
    <Shell>
      <Sidebar>
        <strong>{behavior.appName}</strong>
        <Navigation aria-label={behavior.navigationLabel}>
          <Link to="/">{behavior.home}</Link>
          <Link to="/library">{behavior.library}</Link>
          <Link to="/models">{behavior.models}</Link>
          <Link to="/settings">{behavior.settings}</Link>
        </Navigation>
      </Sidebar>
      <Content>
        <Outlet />
      </Content>
    </Shell>
  );
}
