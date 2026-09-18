import { Undo2 } from "lucide-react";
import { DraggableNumberInput } from "../../../../components/DraggableNumberInput";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import {
  ColorField,
  ColorFieldControl,
  Field,
  FieldGrid,
  FontStyleControls,
  FullWidthField,
} from "../../styles";
import { CubicBezierEditor } from "../CubicBezierEditor";

import { ColorInput } from "../ColorInput";
import { useBehavior, type SubtitleStyleFieldsProps } from "./behavior";

export function SubtitleStyleFields(props: SubtitleStyleFieldsProps) {
  const {
    behavior,
    bannerColors,
    bannerSpeedLabel,
    bannerFontSizeLabel,
    bannerTransparencyLabel,
    bannerLongWordAlignmentLabel,
    bannerAlignCenterLabel,
    bannerAlignLeftLabel,
    bannerTransparency,
    onBannerTransparencyChange,
    showBanner,
    showBannerSpeed,
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
  } = useBehavior(props);
  return (
    <>
      <FieldGrid>
        <Field>
          <span>{behavior.positionXLabel}</span>
          <DraggableNumberInput
            value={positionX}
            onValueChange={(value) => onStyleChange("x", Number(value))}
          />
        </Field>
        <Field>
          <span>{behavior.positionYLabel}</span>
          <DraggableNumberInput
            value={positionY}
            onValueChange={(value) => onStyleChange("y", Number(value))}
          />
        </Field>
        <Field>
          <span>{behavior.scaleLabel}</span>
          <DraggableNumberInput
            min="25"
            max="400"
            step="1"
            value={scale}
            placeholder={inheritedScale}
            onValueChange={onScaleInput}
            onBlur={onScaleBlur}
          />
        </Field>
        <Render when={!showBanner}>
          <Field>
            <span>{behavior.readAnimationLabel}</span>
            <select value={curve} onChange={onCurveChange}>
              <ForEach
                data={curveOptions}
                idCompute={behavior.getCurveOptionId}
                render={behavior.renderCurveOption}
              />
            </select>
          </Field>
        </Render>
        <FullWidthField>
          <span>{behavior.fontFamilyLabel}</span>
          <select
            value={style.fontFamily}
            onChange={(event) =>
              onStyleChange("fontFamily", event.target.value)
            }
          >
            <ForEach
              data={behavior.fontOptions}
              idCompute={behavior.getFontOptionId}
              render={(font) => <option value={font.id}>{font.name}</option>}
            />
          </select>
        </FullWidthField>
        <FullWidthField>
          <span>{behavior.fontStyleLabel}</span>
          <FontStyleControls $withInheritance={onStyleInherit !== null}>
            <button
              type="button"
              data-active={style.fontWeight === "bold"}
              aria-label={behavior.boldLabel}
              aria-pressed={style.fontWeight === "bold"}
              onClick={() =>
                onStyleChange(
                  "fontWeight",
                  style.fontWeight === "bold" ? "normal" : "bold"
                )
              }
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              data-active={style.fontStyle === "italic"}
              aria-label={behavior.italicLabel}
              aria-pressed={style.fontStyle === "italic"}
              onClick={() =>
                onStyleChange(
                  "fontStyle",
                  style.fontStyle === "italic" ? "normal" : "italic"
                )
              }
            >
              <em>I</em>
            </button>
            <button
              type="button"
              data-active={style.textDecoration === "underline"}
              aria-label={behavior.underlineLabel}
              aria-pressed={style.textDecoration === "underline"}
              onClick={() =>
                onStyleChange(
                  "textDecoration",
                  style.textDecoration === "underline" ? "none" : "underline"
                )
              }
            >
              <u>U</u>
            </button>
            <button
              type="button"
              data-active={style.verticalAlign === "super"}
              aria-label={behavior.superscriptLabel}
              aria-pressed={style.verticalAlign === "super"}
              onClick={() =>
                onStyleChange(
                  "verticalAlign",
                  style.verticalAlign === "super" ? "baseline" : "super"
                )
              }
            >
              x<sup>2</sup>
            </button>
            <button
              type="button"
              data-active={style.verticalAlign === "sub"}
              aria-label={behavior.subscriptLabel}
              aria-pressed={style.verticalAlign === "sub"}
              onClick={() =>
                onStyleChange(
                  "verticalAlign",
                  style.verticalAlign === "sub" ? "baseline" : "sub"
                )
              }
            >
              x<sub>2</sub>
            </button>
            <Render when={onStyleInherit !== null}>
              <button
                type="button"
                aria-label={behavior.inheritLabel}
                title={behavior.inheritLabel}
                onClick={() => onStyleInherit?.("typography")}
              >
                <Undo2 size={14} aria-hidden="true" />
              </button>
            </Render>
          </FontStyleControls>
        </FullWidthField>
        <ColorField>
          <span>{behavior.unreadLabel}</span>
          <ColorFieldControl>
            <ColorInput
              color={style.unreadColor}
              label={behavior.unreadLabel}
              onChange={(color) => onStyleChange("unreadColor", color)}
              onPreviewChange={(color) => onColorPreview("unreadColor", color)}
              onPreviewEnd={onColorPreviewEnd}
            />
            <Render when={onColorInherit !== null}>
              <button
                type="button"
                aria-label={`${behavior.inheritLabel} ${behavior.unreadLabel}`}
                onClick={() => onColorInherit?.("unreadColor")}
              >
                {behavior.inheritLabel}
              </button>
            </Render>
          </ColorFieldControl>
        </ColorField>
        <ColorField>
          <span>{behavior.readLabel}</span>
          <ColorFieldControl>
            <ColorInput
              color={style.readColor}
              label={behavior.readLabel}
              onChange={(color) => onStyleChange("readColor", color)}
              onPreviewChange={(color) => onColorPreview("readColor", color)}
              onPreviewEnd={onColorPreviewEnd}
            />
            <Render when={onColorInherit !== null}>
              <button
                type="button"
                aria-label={`${behavior.inheritLabel} ${behavior.readLabel}`}
                onClick={() => onColorInherit?.("readColor")}
              >
                {behavior.inheritLabel}
              </button>
            </Render>
          </ColorFieldControl>
        </ColorField>
        <Render when={showBannerSpeed}>
          <Field>
            <span>{bannerSpeedLabel}</span>
            <DraggableNumberInput
              min="1"
              max="1000"
              value={style.bannerSpeed}
              onValueChange={(value) =>
                onStyleChange(
                  "bannerSpeed",
                  Math.max(1, Math.min(1000, Number(value) || 300))
                )
              }
            />
          </Field>
        </Render>
        <Render when={showBanner}>
          <Field>
            <span>{bannerFontSizeLabel}</span>
            <DraggableNumberInput
              min="6"
              max="96"
              step="1"
              value={style.bannerFontSize}
              onValueChange={(value) =>
                onStyleChange(
                  "bannerFontSize",
                  Math.max(6, Math.min(96, Number(value) || 14))
                )
              }
            />
            <Render when={onStyleInherit !== null}>
              <button
                type="button"
                aria-label={`${behavior.inheritLabel} ${bannerFontSizeLabel}`}
                onClick={() => onStyleInherit?.("bannerFontSize")}
              >
                {behavior.inheritLabel}
              </button>
            </Render>
          </Field>
          <Field>
            <span>{bannerTransparencyLabel}</span>
            <DraggableNumberInput
              min="0"
              max="100"
              step="1"
              value={bannerTransparency}
              onValueChange={onBannerTransparencyChange}
            />
            <Render when={onStyleInherit !== null}>
              <button
                type="button"
                aria-label={`${behavior.inheritLabel} ${bannerTransparencyLabel}`}
                onClick={() => onStyleInherit?.("bannerRectangleOpacity")}
              >
                {behavior.inheritLabel}
              </button>
            </Render>
          </Field>
          <Field>
            <span>{bannerLongWordAlignmentLabel}</span>
            <select
              value={style.bannerLongWordAlignment}
              onChange={(event) =>
                onStyleChange(
                  "bannerLongWordAlignment",
                  event.target.value as "center" | "left"
                )
              }
            >
              <option value="center">{bannerAlignCenterLabel}</option>
              <option value="left">{bannerAlignLeftLabel}</option>
            </select>
            <Render when={onStyleInherit !== null}>
              <button
                type="button"
                aria-label={`${behavior.inheritLabel} ${bannerLongWordAlignmentLabel}`}
                onClick={() => onStyleInherit?.("bannerLongWordAlignment")}
              >
                {behavior.inheritLabel}
              </button>
            </Render>
          </Field>
          <ForEach
            data={bannerColors}
            idCompute={(item) => item.property}
            render={(item) => (
              <ColorField>
                <span>{item.label}</span>
                <ColorFieldControl>
                  <ColorInput
                    color={style[item.property]}
                    label={item.label}
                    onChange={(color) => onStyleChange(item.property, color)}
                  />
                  <Render when={onStyleInherit !== null}>
                    <button
                      type="button"
                      aria-label={`${behavior.inheritLabel} ${item.label}`}
                      onClick={() => onStyleInherit?.(item.property)}
                    >
                      {behavior.inheritLabel}
                    </button>
                  </Render>
                </ColorFieldControl>
              </ColorField>
            )}
          />
        </Render>
      </FieldGrid>
      <Render when={showBezier && !showBanner}>
        <CubicBezierEditor
          value={curve}
          labels={behavior.bezierLabels}
          onChange={onBezierChange}
        />
      </Render>
    </>
  );
}
