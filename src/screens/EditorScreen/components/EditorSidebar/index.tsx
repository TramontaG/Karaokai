import { memo, useState } from "react";
import { FileUp, Mic2, Plus, Trash2, Undo2, Volume2, X } from "lucide-react";
import { DraggableNumberInput } from "../../../../components/DraggableNumberInput";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  AnimationDescription,
  BackgroundAssetName,
  ColorFieldControl,
  ColorField,
  ColorInputValue,
  Field,
  FieldGrid,
  FontStyleControls,
  FullWidthField,
  InheritanceHint,
  Inspector,
  InspectorEmpty,
  MixerChannel,
  MixerContent,
  MixerHeader,
  MixerMeter,
  BackgroundAssetButton,
  PhraseActions,
  PropertyAccordion,
  PropertyAccordionContent,
  PropertyAccordions,
  Tabs,
  TrackActions,
  WordList,
  WordTimingRow,
} from "../../styles";
import { CubicBezierEditor } from "../CubicBezierEditor";
import { PhraseTextInput } from "../PhraseTextInput";
import { WordTextInput } from "../WordTextInput";

type Scope = "Track" | "Phrase" | "Word";

function normalizeHexColor(value: string) {
  const compact = value.trim();
  const shorthand = /^#([\da-f]{3})$/i.exec(compact);

  if (shorthand) {
    return `#${shorthand[1]
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`.toUpperCase();
  }

  return /^#[\da-f]{6}$/i.test(compact) ? compact.toUpperCase() : null;
}

function ColorInput({
  color,
  label,
  onChange,
  onPreviewChange,
  onPreviewEnd,
}: {
  color: string;
  label: string;
  onChange: (color: string) => void;
  onPreviewChange?: (color: string) => void;
  onPreviewEnd?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? color;

  const commit = () => {
    const normalizedColor = normalizeHexColor(value);

    if (normalizedColor && normalizedColor !== color) {
      onChange(normalizedColor);
    }

    onPreviewEnd?.();
    setDraft(null);
  };

  const updateDraft = (nextValue: string) => {
    setDraft(nextValue);
    const normalizedColor = normalizeHexColor(nextValue);
    if (normalizedColor) onPreviewChange?.(normalizedColor);
  };

  return (
    <ColorInputValue>
      <input
        type="color"
        value={normalizeHexColor(value) ?? color}
        aria-label={label}
        onChange={(event) => updateDraft(event.target.value.toUpperCase())}
        onBlur={commit}
      />
      <input
        type="text"
        value={value}
        aria-label={`${label} hexadecimal`}
        spellCheck="false"
        onChange={(event) => updateDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setDraft(null);
            onPreviewEnd?.();
            event.currentTarget.blur();
          }
        }}
      />
    </ColorInputValue>
  );
}

function StyleFields({ scope }: { scope: Scope }) {
  const behavior = useEditorBehavior();
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
      </FieldGrid>
      <Render when={showBezier}>
        <CubicBezierEditor
          value={curve}
          labels={behavior.bezierLabels}
          onChange={onBezierChange}
        />
      </Render>
    </>
  );
}

function EditorSidebarView() {
  useEditorState((behavior) => behavior.sidebarRenderKey);
  const behavior = useEditorBehavior();
  return (
    <Inspector>
      <Tabs role="tablist" aria-label={behavior.inspectorTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={behavior.propertiesActive}
          data-active={behavior.propertiesActive}
          onClick={behavior.onShowProperties}
        >
          {behavior.propertiesLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={behavior.mixerActive}
          data-active={behavior.mixerActive}
          onClick={behavior.onShowMixer}
        >
          {behavior.mixerLabel}
        </button>
      </Tabs>
      <Render when={behavior.propertiesActive}>
        <Render when={behavior.backgroundTrackSelected}>
          <PropertyAccordions>
            <PropertyAccordion open>
              <summary>{behavior.backgroundClipLabel}</summary>
              <PropertyAccordionContent>
                <Field>
                  <span>{behavior.backgroundPresetLabel}</span>
                  <select
                    value={behavior.backgroundPreset}
                    onChange={(event) =>
                      void behavior.onBackgroundPresetChange(
                        event.target.value as
                          "album-art" | "video" | "image" | "solid" | "gradient"
                      )
                    }
                  >
                    <option value="album-art">
                      {behavior.backgroundAlbumArtLabel}
                    </option>
                    <option value="video">
                      {behavior.backgroundVideoLabel}
                    </option>
                    <option value="image">
                      {behavior.backgroundImageLabel}
                    </option>
                    <option value="solid">
                      {behavior.backgroundSolidLabel}
                    </option>
                    <option value="gradient">
                      {behavior.backgroundGradientLabel}
                    </option>
                  </select>
                </Field>
                <Render
                  when={
                    behavior.backgroundPreset === "video" ||
                    behavior.backgroundPreset === "image"
                  }
                >
                  <Field>
                    <span>
                      {behavior.backgroundAsset
                        ? behavior.backgroundReplaceLabel
                        : behavior.backgroundChooseLabel}
                    </span>
                    <BackgroundAssetButton
                      type="button"
                      onClick={() =>
                        void behavior.onBackgroundAssetImport(
                          behavior.backgroundPreset === "video"
                            ? "video"
                            : "image"
                        )
                      }
                    >
                      <FileUp size={15} aria-hidden="true" />
                      {behavior.backgroundAsset
                        ? behavior.backgroundReplaceLabel
                        : behavior.backgroundChooseLabel}
                    </BackgroundAssetButton>
                    <Render when={behavior.backgroundAssetName !== null}>
                      <BackgroundAssetName
                        title={behavior.backgroundAssetName ?? undefined}
                      >
                        {behavior.backgroundSelectedFileLabel}
                      </BackgroundAssetName>
                    </Render>
                  </Field>
                </Render>
                <Render
                  when={
                    behavior.backgroundPreset === "video" ||
                    behavior.backgroundPreset === "image" ||
                    behavior.backgroundPreset === "album-art"
                  }
                >
                  <Field>
                    <span>{behavior.backgroundFitLabel}</span>
                    <select
                      value={behavior.backgroundFit}
                      onChange={(event) =>
                        behavior.onBackgroundChange({
                          fit: event.target.value as "cover" | "contain",
                        })
                      }
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </Field>
                </Render>
                <Render
                  when={
                    behavior.backgroundPreset === "solid" ||
                    behavior.backgroundPreset === "image" ||
                    behavior.backgroundPreset === "album-art"
                  }
                >
                  <Field>
                    <span>{behavior.backgroundColorLabel}</span>
                    <ColorInput
                      color={behavior.backgroundColor}
                      label={behavior.backgroundColorLabel}
                      onChange={(color) =>
                        behavior.onBackgroundChange({ color })
                      }
                    />
                  </Field>
                </Render>
                <Render when={behavior.backgroundPreset === "gradient"}>
                  <>
                    <Field>
                      <span>{behavior.backgroundGradientStartLabel}</span>
                      <ColorInput
                        color={behavior.backgroundGradientStart}
                        label={behavior.backgroundGradientStartLabel}
                        onChange={(gradientStart) =>
                          behavior.onBackgroundChange({ gradientStart })
                        }
                      />
                    </Field>
                    <Field>
                      <span>{behavior.backgroundGradientEndLabel}</span>
                      <ColorInput
                        color={behavior.backgroundGradientEnd}
                        label={behavior.backgroundGradientEndLabel}
                        onChange={(gradientEnd) =>
                          behavior.onBackgroundChange({ gradientEnd })
                        }
                      />
                    </Field>
                    <Field>
                      <span>{behavior.backgroundGradientAngleLabel}</span>
                      <DraggableNumberInput
                        min="0"
                        max="360"
                        value={behavior.backgroundGradientAngle}
                        onValueChange={(value) =>
                          behavior.onBackgroundChange({
                            gradientAngle: Number(value),
                          })
                        }
                      />
                    </Field>
                  </>
                </Render>
              </PropertyAccordionContent>
            </PropertyAccordion>
          </PropertyAccordions>
        </Render>
        <Render when={behavior.selectedSubtitleTrack !== null}>
          <PropertyAccordions>
            <PropertyAccordion open>
              <summary>{behavior.trackStyleLabel}</summary>
              <PropertyAccordionContent>
                <StyleFields scope="Track" />
                <Field>
                  <span>{behavior.animationTemplateLabel}</span>
                  <select
                    value={behavior.animationTemplate}
                    onChange={behavior.onAnimationTemplateChange}
                  >
                    <option value="template-1">
                      {behavior.animationTemplateOneLabel}
                    </option>
                  </select>
                </Field>
                <AnimationDescription>
                  {behavior.animationTemplateOneDescription}
                </AnimationDescription>
                <TrackActions>
                  <button type="button" onClick={behavior.onRequestDeleteTrack}>
                    <Trash2 size={15} />
                    {behavior.deleteTrackLabel}
                  </button>
                </TrackActions>
              </PropertyAccordionContent>
            </PropertyAccordion>
            <PropertyAccordion>
              <summary>{behavior.phraseStyleLabel}</summary>
              <Render when={behavior.activePhrase !== null}>
                <PropertyAccordionContent>
                  <Field>
                    <span>{behavior.textLabel}</span>
                    <PhraseTextInput
                      phraseId={behavior.activePhrase?.id ?? ""}
                      value={behavior.activePhrase?.text ?? ""}
                      onCommit={behavior.onPhraseTextCommit}
                    />
                  </Field>
                  <FieldGrid>
                    <Field>
                      <span>{behavior.startLabel}</span>
                      <DraggableNumberInput
                        min="0"
                        step="0.01"
                        value={(behavior.activePhrase?.start ?? 0) / 1000}
                        onValueChange={behavior.onPhraseStartInput}
                      />
                    </Field>
                    <Field>
                      <span>{behavior.endLabel}</span>
                      <DraggableNumberInput
                        min="0"
                        step="0.01"
                        value={(behavior.activePhrase?.end ?? 0) / 1000}
                        onValueChange={behavior.onPhraseEndInput}
                      />
                    </Field>
                  </FieldGrid>
                  <StyleFields scope="Phrase" />
                  <Field>
                    <span>{behavior.wordsLabel}</span>
                    <WordList>
                      <ForEach
                        data={behavior.inspectorWords}
                        idCompute={behavior.getWordId}
                        render={(word) => (
                          <WordTimingRow
                            $active={word.id === behavior.selectedWord?.id}
                          >
                            <WordTextInput
                              label={behavior.wordTextLabel}
                              placeholder={behavior.gapLabel}
                              disabled={false}
                              value={word.type === "gap" ? "" : word.text}
                              onFocus={() =>
                                behavior.onInspectorWordSelect(word.id)
                              }
                              onCommit={(value) =>
                                behavior.onInspectorWordTextInput(
                                  word.id,
                                  value
                                )
                              }
                            />
                            <DraggableNumberInput
                              aria-label={`${word.type === "gap" ? behavior.gapLabel : word.text} ${behavior.startLabel}`}
                              min="0"
                              step="0.01"
                              value={word.start / 1000}
                              onValueChange={(value) =>
                                behavior.onInspectorWordStartInput(
                                  word.id,
                                  value
                                )
                              }
                            />
                            <DraggableNumberInput
                              aria-label={`${word.type === "gap" ? behavior.gapLabel : word.text} ${behavior.endLabel}`}
                              min="0"
                              step="0.01"
                              value={word.end / 1000}
                              onValueChange={(value) =>
                                behavior.onInspectorWordEndInput(word.id, value)
                              }
                            />
                            <button
                              type="button"
                              data-word-action="insert-gap"
                              aria-label={behavior.insertGapLabel}
                              title={behavior.insertGapLabel}
                              onClick={() =>
                                behavior.onInsertInspectorGap(word.id)
                              }
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              type="button"
                              data-word-action="delete"
                              aria-label={behavior.deleteWordLabel}
                              title={behavior.deleteWordLabel}
                              onClick={() =>
                                behavior.onDeleteInspectorWord(word.id)
                              }
                            >
                              <X size={13} />
                            </button>
                          </WordTimingRow>
                        )}
                      />
                    </WordList>
                  </Field>
                  <PhraseActions>
                    <button
                      type="button"
                      title={behavior.deletePhraseShortcut}
                      onClick={behavior.onDeletePhrase}
                    >
                      <Trash2 size={15} />
                      {behavior.deletePhraseLabel}
                      <kbd>{behavior.deleteKeyLabel}</kbd>
                    </button>
                  </PhraseActions>
                </PropertyAccordionContent>
              </Render>
              <Render when={behavior.activePhrase === null}>
                <PropertyAccordionContent></PropertyAccordionContent>
              </Render>
            </PropertyAccordion>
            <PropertyAccordion>
              <summary>{behavior.wordStyleLabel}</summary>
              <Render when={behavior.selectedWord !== null}>
                <PropertyAccordionContent>
                  <InheritanceHint>
                    {behavior.inheritScaleLabel}
                  </InheritanceHint>
                  <FieldGrid>
                    <Field>
                      <span>{behavior.startLabel}</span>
                      <DraggableNumberInput
                        min="0"
                        step="0.01"
                        value={(behavior.selectedWord?.start ?? 0) / 1000}
                        onValueChange={behavior.onWordStartInput}
                      />
                    </Field>
                    <Field>
                      <span>{behavior.endLabel}</span>
                      <DraggableNumberInput
                        min="0"
                        step="0.01"
                        value={(behavior.selectedWord?.end ?? 0) / 1000}
                        onValueChange={behavior.onWordEndInput}
                      />
                    </Field>
                  </FieldGrid>
                  <StyleFields scope="Word" />
                </PropertyAccordionContent>
              </Render>
            </PropertyAccordion>
          </PropertyAccordions>
        </Render>
      </Render>
      <Render when={behavior.mixerActive}>
        <MixerContent>
          <MixerHeader>{behavior.mixerDescription}</MixerHeader>
          <MixerChannel>
            <label htmlFor="instrumental-volume">
              <Volume2 size={17} />
              <span>{behavior.instrumentalVolumeLabel}</span>
              <output>{behavior.instrumentalVolume}%</output>
            </label>
            <input
              id="instrumental-volume"
              type="range"
              min="0"
              max="100"
              value={behavior.instrumentalVolume}
              onChange={behavior.onInstrumentalVolumeChange}
            />
            <MixerMeter style={{ width: `${behavior.instrumentalVolume}%` }} />
          </MixerChannel>
          <MixerChannel>
            <label htmlFor="vocals-volume">
              <Mic2 size={17} />
              <span>{behavior.vocalsVolumeLabel}</span>
              <output>{behavior.vocalsVolume}%</output>
            </label>
            <input
              id="vocals-volume"
              type="range"
              min="0"
              max="100"
              value={behavior.vocalsVolume}
              onChange={behavior.onVocalsVolumeChange}
            />
            <MixerMeter style={{ width: `${behavior.vocalsVolume}%` }} />
          </MixerChannel>
        </MixerContent>
      </Render>
    </Inspector>
  );
}

export const EditorSidebar = memo(EditorSidebarView);
EditorSidebar.displayName = "EditorSidebar";
