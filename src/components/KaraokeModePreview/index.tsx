import { useBehavior, type Props } from "./behavior";
export function KaraokeModePreview(props: Props) {
  const behavior = useBehavior(props);
  return behavior.content;
}
