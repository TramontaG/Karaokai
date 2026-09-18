import { ForEach } from "../ForEach";
import { useBehavior, type Props } from "./behavior";
export function KaraokeModeSelector(props: Props) {
  const behavior = useBehavior(props);
  return (
    <select value={behavior.value} onChange={behavior.onChange}>
      <ForEach
        data={behavior.options}
        idCompute={behavior.getId}
        render={behavior.renderOption}
      />
    </select>
  );
}
