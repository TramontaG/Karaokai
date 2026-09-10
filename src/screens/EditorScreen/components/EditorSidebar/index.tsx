import { FileUp, Plus, Trash2, X } from "lucide-react";
import { memo } from "react";
import { DraggableNumberInput } from "../../../../components/DraggableNumberInput";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import type { EditorSidebarModel } from "../../../../hooks/editor/componentModels";
import {
  AnimationDescription,
  BackgroundAssetButton,
  BackgroundAssetName,
  Field,
  FieldGrid,
  InheritanceHint,
  Inspector,
  PhraseActions,
  PropertyAccordionContent,
  Tabs,
  TrackActions,
  WordList,
  WordTimingRow,
} from "../../styles";
import { ColorInput } from "../ColorInput";
import { PhraseTextInput } from "../PhraseTextInput";
import { SubtitleStyleFields } from "../SubtitleStyleFields";
import { WordTextInput } from "../WordTextInput";

function EditorSidebarView({ model: behavior }: { model: EditorSidebarModel }) {
  return (
    <Inspector>
      <Render when={behavior.backgroundTrackSelected}>
        <Tabs role="tablist" aria-label={behavior.backgroundClipLabel}>
          <button type="button" role="tab" aria-selected data-active>
            {behavior.backgroundClipLabel}
          </button>
        </Tabs>
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
              <option value="video">{behavior.backgroundVideoLabel}</option>
              <option value="image">{behavior.backgroundImageLabel}</option>
              <option value="solid">{behavior.backgroundSolidLabel}</option>
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
                    behavior.backgroundPreset === "video" ? "video" : "image"
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
                onChange={(color) => behavior.onBackgroundChange({ color })}
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
      </Render>
      <Render when={behavior.selectedSubtitleTrack !== null}>
        <Tabs role="tablist" aria-label={behavior.trackStyleLabel}>
          <button
            type="button"
            role="tab"
            aria-selected={behavior.trackTabActive}
            data-active={behavior.trackTabActive}
            onClick={behavior.onShowTrackTab}
          >
            {behavior.trackStyleLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={behavior.phraseTabActive}
            data-active={behavior.phraseTabActive}
            onClick={behavior.onShowPhraseTab}
          >
            {behavior.phraseStyleLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={behavior.wordTabActive}
            data-active={behavior.wordTabActive}
            onClick={behavior.onShowWordTab}
          >
            {behavior.wordStyleLabel}
          </button>
        </Tabs>
        <Render when={behavior.trackTabActive}>
          <PropertyAccordionContent>
            <SubtitleStyleFields scope="Track" model={behavior} />
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
        </Render>
        <Render when={behavior.phraseTabActive}>
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
              <SubtitleStyleFields scope="Phrase" model={behavior} />
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
                            behavior.onInspectorWordTextInput(word.id, value)
                          }
                        />
                        <DraggableNumberInput
                          aria-label={`${word.type === "gap" ? behavior.gapLabel : word.text} ${behavior.startLabel}`}
                          min="0"
                          step="0.01"
                          value={word.start / 1000}
                          onValueChange={(value) =>
                            behavior.onInspectorWordStartInput(word.id, value)
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
                          onClick={() => behavior.onInsertInspectorGap(word.id)}
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
        </Render>
        <Render when={behavior.wordTabActive}>
          <Render when={behavior.selectedWord !== null}>
            <PropertyAccordionContent>
              <InheritanceHint>{behavior.inheritScaleLabel}</InheritanceHint>
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
              <SubtitleStyleFields scope="Word" model={behavior} />
            </PropertyAccordionContent>
          </Render>
        </Render>
      </Render>
    </Inspector>
  );
}

export const EditorSidebar = memo(EditorSidebarView);
EditorSidebar.displayName = "EditorSidebar";
