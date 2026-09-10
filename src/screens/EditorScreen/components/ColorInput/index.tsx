import { ColorInputValue } from "../../styles";
import { useBehavior, type ColorInputProps } from "./behavior";

export function ColorInput(props: ColorInputProps) {
  const behavior = useBehavior(props);
  return (
    <ColorInputValue>
      <input
        type="color"
        value={behavior.colorValue}
        aria-label={behavior.label}
        onChange={behavior.onColorChange}
        onBlur={behavior.commit}
      />
      <input
        type="text"
        value={behavior.value}
        aria-label={behavior.textLabel}
        spellCheck="false"
        onChange={behavior.onTextChange}
        onBlur={behavior.commit}
        onKeyDown={behavior.onKeyDown}
      />
    </ColorInputValue>
  );
}
