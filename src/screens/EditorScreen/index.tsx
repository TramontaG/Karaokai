import { PlaceholderScreen } from "../../components/PlaceholderScreen";
import { useBehavior } from "./behavior";
export function EditorScreen() {
  const behavior = useBehavior({});
  return (
    <PlaceholderScreen
      title={behavior.title}
      description={behavior.description}
    />
  );
}
