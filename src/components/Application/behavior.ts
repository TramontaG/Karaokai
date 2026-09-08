import { useAppBootstrap } from "../../hooks/useAppBootstrap";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useSubtitleFonts } from "../../hooks/useSubtitleFonts";
export function useBehavior(_: Record<string, never>) {
  const bootstrap = useAppBootstrap();
  const { completed } = useOnboarding();
  const fontsReady = useSubtitleFonts();
  return {
    ...bootstrap,
    fontsReady,
    needsOnboarding: !completed,
    canOpenApp: completed && fontsReady,
  };
}
