import type { EditorSidebarModel } from "../../../../hooks/editor/componentModels";

export interface SubtitleStyleFieldsProps {
  scope: "Track" | "Phrase" | "Word";
  model: EditorSidebarModel;
}

export function useBehavior({
  scope,
  model: behavior,
}: SubtitleStyleFieldsProps) {
  const lower = scope.toLowerCase() as "track" | "phrase" | "word";
  const style = behavior[`${lower}Style`];
  const onStyleChange = behavior[`on${scope}StyleChange`];
  const onColorPreview = behavior[`on${scope}ColorPreview`];
  const onColorPreviewEnd = behavior.onColorPreviewEnd;
  const onColorInherit =
    scope === "Track" ? null : behavior[`on${scope}ColorInherit`];
  const onStyleInherit =
    scope === "Track" ? null : behavior[`on${scope}StyleInherit`];
  const positionX = behavior[`${lower}PositionX`] ?? behavior.trackPositionX;
  const positionY = behavior[`${lower}PositionY`] ?? behavior.trackPositionY;
  const scale = behavior[`${lower}ScaleInputValue`];
  const inheritedScale =
    scope === "Track"
      ? undefined
      : behavior[`inherited${scope}ScalePlaceholder`];
  const onScaleInput = behavior[`on${scope}ScaleInput`];
  const onScaleBlur = behavior[`on${scope}ScaleBlur`];
  const curve = behavior[`${lower}Curve`];
  const curveOptions = behavior[`${lower}CurveOptions`];
  const onCurveChange = behavior[`on${scope}CurveChange`];
  const showBezier = behavior[`show${scope}BezierEditor`];
  const onBezierChange = behavior[`on${scope}BezierChange`];

  return {
    behavior,
    scope,
    lower,
    style,
    onStyleChange,
    onColorPreview,
    onColorPreviewEnd,
    onColorInherit,
    onStyleInherit,
    positionX,
    positionY,
    scale,
    inheritedScale,
    onScaleInput,
    onScaleBlur,
    curve,
    curveOptions,
    onCurveChange,
    showBezier,
    onBezierChange,
  };
}
