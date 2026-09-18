import { createElement, type ChangeEvent } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { karaokeModes } from "../../util/karaoke/modes";
import type { KaraokeMode } from "../../domain/project";
export interface Props {
  value: KaraokeMode;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}
export function useBehavior(props: Props) {
  const { t } = useTranslation();
  return {
    ...props,
    options: Object.entries(karaokeModes),
    getId: ([id]: [string, unknown]) => id,
    renderOption: ([id, mode]: [string, (typeof karaokeModes)[KaraokeMode]]) =>
      createElement("option", { value: id }, t(mode.label)),
  };
}
