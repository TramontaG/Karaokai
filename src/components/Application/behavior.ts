import { useAppBootstrap } from "../../hooks/useAppBootstrap";
export function useBehavior(_: Record<string, never>) {
  return useAppBootstrap();
}
