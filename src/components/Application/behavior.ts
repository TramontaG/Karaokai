import { useAppBootstrap } from "../../hooks/useAppBootstrap";
import { useOnboarding } from "../../hooks/useOnboarding";
export function useBehavior(_: Record<string, never>) {
  const bootstrap = useAppBootstrap();
  const { completed } = useOnboarding();
  return { ...bootstrap, needsOnboarding: !completed, canOpenApp: completed };
}
