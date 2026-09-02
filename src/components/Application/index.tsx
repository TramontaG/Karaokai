import { ThemeProvider } from "@emotion/react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../../router";
import { LoadingScreen } from "../LoadingScreen";
import { Onboarding } from "../Onboarding";
import { Render } from "../Render";
import { useBehavior } from "./behavior";
export function Application() {
  const behavior = useBehavior({});
  return (
    <ThemeProvider theme={behavior.theme}>
      <Render when={behavior.isLoading}>
        <LoadingScreen />
      </Render>
      <Render when={behavior.isReady}>
        <Render when={behavior.needsOnboarding}>
          <Onboarding />
        </Render>
        <Render when={behavior.canOpenApp}>
          <RouterProvider router={router} />
        </Render>
      </Render>
    </ThemeProvider>
  );
}
