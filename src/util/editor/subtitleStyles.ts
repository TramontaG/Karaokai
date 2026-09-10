import { type SubtitlePhrase, type SubtitleStyle } from "../../domain/project";
import { type CurveOption } from "./types";

export function optionalStyleScale(
  style: SubtitlePhrase["style"],
  scale: number | undefined
) {
  const next = { ...style };
  if (scale === undefined) delete next.scale;
  else next.scale = scale;
  return Object.keys(next).length > 0 ? next : undefined;
}

export function withoutStyleProperty(
  style: SubtitlePhrase["style"],
  property: keyof SubtitleStyle | "typography"
) {
  const next = { ...style };
  if (property === "typography") {
    delete next.fontFamily;
    delete next.fontWeight;
    delete next.fontStyle;
    delete next.textDecoration;
    delete next.verticalAlign;
  } else {
    delete next[property];
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function curveOptionsWithCurrent(
  options: CurveOption[],
  currentCurve: string
) {
  if (
    currentCurve === "inherit" ||
    options.some((option) => option.id === currentCurve)
  ) {
    return options;
  }
  return [...options, { id: currentCurve, label: currentCurve }];
}
