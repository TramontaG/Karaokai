import { memo, useEffect, useState } from "react";
import { Mic2, Trash2, Volume2 } from "lucide-react";
import { DraggableNumberInput } from "../../../../components/DraggableNumberInput";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  AnimationDescription,
  ColorFieldControl,
  ColorField,
  ColorInputValue,
  Field,
  FieldGrid,
  InheritanceHint,
  Inspector,
  InspectorEmpty,
  MixerChannel,
  MixerContent,
  MixerHeader,
  MixerMeter,
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
}: {
  color: string;
  label: string;
  onChange: (color: string) => void;
}) {
  const [value, setValue] = useState(color);

  useEffect(() => setValue(color), [color]);

  const commit = () => {
    const normalizedColor = normalizeHexColor(value);

    if (normalizedColor) {
      onChange(normalizedColor);
      setValue(normalizedColor);
      return;
    }

    setValue(color);
  };

  return (
    <ColorInputValue>
      <input
        type="color"
        value={color}
        aria-label={label}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
      />
      <input
        type="text"
        value={value}
        aria-label={`${label} hexadecimal`}
        spellCheck="false"
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setValue(color);
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
  const onColorInherit =
    scope === "Track" ? null : behavior[`on${scope}ColorInherit`];
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
        <ColorField>
          <span>{behavior.unreadLabel}</span>
          <ColorFieldControl>
            <ColorInput
              color={style.unreadColor}
              label={behavior.unreadLabel}
              onChange={(color) => onStyleChange("unreadColor", color)}
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
      <Field>
        <span>{behavior.caretLabel}</span>
        <input
          type="checkbox"
          checked={style.hasCaret}
          onChange={(event) => onStyleChange("hasCaret", event.target.checked)}
        />
      </Field>
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
                    <textarea
                      value={behavior.activePhrase?.text ?? ""}
                      onChange={behavior.onTextInput}
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
                            <button
                              type="button"
                              onClick={() =>
                                behavior.onInspectorWordSelect(word.id)
                              }
                            >
                              {word.text}
                            </button>
                            <DraggableNumberInput
                              aria-label={`${word.text} ${behavior.startLabel}`}
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
                              aria-label={`${word.text} ${behavior.endLabel}`}
                              min="0"
                              step="0.01"
                              value={word.end / 1000}
                              onValueChange={(value) =>
                                behavior.onInspectorWordEndInput(word.id, value)
                              }
                            />
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
                <PropertyAccordionContent>
                  <InspectorEmpty>{behavior.emptyInspector}</InspectorEmpty>
                </PropertyAccordionContent>
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
              <Render when={behavior.selectedWord === null}>
                <PropertyAccordionContent>
                  <InspectorEmpty>{behavior.emptyInspector}</InspectorEmpty>
                </PropertyAccordionContent>
              </Render>
            </PropertyAccordion>
          </PropertyAccordions>
        </Render>
        <Render when={behavior.selectedSubtitleTrack === null}>
          <InspectorEmpty>{behavior.emptyInspector}</InspectorEmpty>
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
