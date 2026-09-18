import { useTranslation } from "../../../../hooks/useTranslation";
import type { EditorSidebarModel } from "../../../../hooks/editor/componentModels";

export interface SubtitleStyleFieldsProps {
  scope: "Track" | "Phrase" | "Word";
  model: EditorSidebarModel;
}

export function useBehavior({
  scope,
  model: behavior,
}: SubtitleStyleFieldsProps) {
  const { t } = useTranslation();
  const bannerColors = (
    [
      "currentColor",
      "playheadColor",
      "unreadRectangleColor",
      "currentRectangleColor",
      "readRectangleColor",
    ] as const
  ).map((property) => ({ property, label: t(`editor.${property}`) }));
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
    bannerColors,
    bannerSpeedLabel: t("editor.bannerSpeed"),
    bannerFontSizeLabel: t("editor.bannerFontSize"),
    bannerTransparencyLabel: t("editor.bannerTransparency"),
    bannerLongWordAlignmentLabel: t("editor.bannerLongWordAlignment"),
    bannerAlignCenterLabel: t("editor.bannerAlignCenter"),
    bannerAlignLeftLabel: t("editor.bannerAlignLeft"),
    bannerTransparency: Math.round((1 - style.bannerRectangleOpacity) * 100),
    onBannerTransparencyChange: (value: string) => {
      const percentage = Number(value);
      if (value.trim() && Number.isFinite(percentage))
        onStyleChange(
          "bannerRectangleOpacity",
          1 - Math.max(0, Math.min(100, percentage)) / 100
        );
    },
    showBanner: behavior.animationTemplate === "banner",
    showBannerSpeed:
      behavior.animationTemplate === "banner" && scope === "Track",
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
