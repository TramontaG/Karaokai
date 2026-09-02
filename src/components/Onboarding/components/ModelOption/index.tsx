import { useBehavior } from "./behavior";
import { Description, Input, Label, Name } from "./styles";

export interface ModelOptionProps {
  model: {
    id: string;
    name: string;
    sizeLabel: string;
    selected: boolean;
  };
  onSelect: (modelId: string) => void;
}

export function ModelOption(props: ModelOptionProps) {
  const behavior = useBehavior(props);

  return (
    <Label>
      <Input
        checked={behavior.selected}
        name="whisper-model"
        onChange={behavior.select}
        type="radio"
      />
      <Name>{behavior.name}</Name>
      <Description>{behavior.sizeLabel}</Description>
    </Label>
  );
}
