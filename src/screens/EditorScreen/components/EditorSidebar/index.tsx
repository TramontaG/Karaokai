import { memo } from "react";
import { Mic2, Trash2, Volume2, X } from "lucide-react";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  AnimationDescription,
  AnimationPanel,
  Field,
  FieldGrid,
  InheritanceHint,
  Inspector,
  InspectorEmpty,
  InspectorHeader,
  MixerChannel,
  MixerContent,
  MixerHeader,
  MixerMeter,
  PhraseActions,
  SectionTitle,
  Tabs,
  TrackActions,
  WordList,
} from "../../styles";
import { CubicBezierEditor } from "../CubicBezierEditor";

function EditorSidebarView() {
  useEditorState((behavior) => behavior.sidebarRenderKey);
  const behavior = useEditorBehavior();
  return (
    <Inspector>
      <InspectorHeader>
        <h2>{behavior.inspectorTitle}</h2>
        <button type="button">
          <X size={15} />
        </button>
      </InspectorHeader>
      <Tabs>
        <button
          type="button"
          data-active={behavior.generalActive}
          onClick={behavior.onShowGeneral}
        >
          {behavior.generalLabel}
        </button>
        <button
          type="button"
          data-active={behavior.styleActive}
          onClick={behavior.onShowStyle}
        >
          {behavior.styleLabel}
        </button>
        <button
          type="button"
          data-active={behavior.animationActive}
          onClick={behavior.onShowAnimation}
        >
          {behavior.animationLabel}
        </button>
        <button
          type="button"
          data-active={behavior.mixerActive}
          onClick={behavior.onShowMixer}
        >
          {behavior.mixerLabel}
        </button>
      </Tabs>
      <Render when={behavior.generalActive}>
        <Render when={behavior.selectedSubtitleTrack !== null}>
          <SectionTitle>{behavior.trackPositionLabel}</SectionTitle>
          <FieldGrid>
            <Field>
              <span>{behavior.positionXLabel}</span>
              <input
                type="number"
                value={behavior.trackPositionX}
                onChange={behavior.onTrackXInput}
              />
            </Field>
            <Field>
              <span>{behavior.positionYLabel}</span>
              <input
                type="number"
                value={behavior.trackPositionY}
                onChange={behavior.onTrackYInput}
              />
            </Field>
          </FieldGrid>
          <TrackActions>
            <button type="button" onClick={behavior.onRequestDeleteTrack}>
              <Trash2 size={15} />
              {behavior.deleteTrackLabel}
            </button>
          </TrackActions>
        </Render>
        <Render when={behavior.activePhrase !== null}>
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
              <input value={behavior.formattedStart} readOnly />
            </Field>
            <Field>
              <span>{behavior.endLabel}</span>
              <input value={behavior.formattedEnd} readOnly />
            </Field>
          </FieldGrid>
          <SectionTitle>{behavior.wordsLabel}</SectionTitle>
          <WordList>
            <ForEach
              data={behavior.inspectorWords}
              idCompute={behavior.getWordId}
              render={behavior.renderWord}
            />
          </WordList>
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
        </Render>
        <Render when={behavior.showGeneralEmpty}>
          <InspectorEmpty>{behavior.emptyInspector}</InspectorEmpty>
        </Render>
      </Render>
      <Render when={behavior.styleActive}>
        <Render when={behavior.selectedSubtitleTrack !== null}>
          <SectionTitle>{behavior.trackStyleLabel}</SectionTitle>
          <FieldGrid>
            <Field>
              <span>{behavior.scaleLabel}</span>
              <input
                type="number"
                min="25"
                max="400"
                step="1"
                value={behavior.trackScaleInputValue}
                onChange={behavior.onTrackScaleInput}
                onBlur={behavior.onTrackScaleBlur}
              />
            </Field>
            <Field>
              <span>{behavior.readAnimationLabel}</span>
              <select
                value={behavior.trackCurve}
                onChange={behavior.onTrackCurveChange}
              >
                <ForEach
                  data={behavior.trackCurveOptions}
                  idCompute={behavior.getCurveOptionId}
                  render={behavior.renderCurveOption}
                />
              </select>
            </Field>
          </FieldGrid>
          <Render when={behavior.showTrackBezierEditor}>
            <CubicBezierEditor
              value={behavior.trackCurve}
              labels={behavior.bezierLabels}
              onChange={behavior.onTrackBezierChange}
            />
          </Render>
        </Render>
        <Render when={behavior.activePhrase !== null}>
          <SectionTitle>{behavior.phraseStyleLabel}</SectionTitle>
          <FieldGrid>
            <Field>
              <span>{behavior.unreadLabel}</span>
              <input
                type="color"
                value={behavior.activeStyle.unreadColor}
                onChange={behavior.onUnreadInput}
              />
            </Field>
            <Field>
              <span>{behavior.readLabel}</span>
              <input
                type="color"
                value={behavior.activeStyle.readColor}
                onChange={behavior.onReadInput}
              />
            </Field>
            <Field>
              <span>{behavior.positionXLabel}</span>
              <input
                type="number"
                value={behavior.activeStyle.x}
                onChange={behavior.onXInput}
              />
            </Field>
            <Field>
              <span>{behavior.positionYLabel}</span>
              <input
                type="number"
                value={behavior.activeStyle.y}
                onChange={behavior.onYInput}
              />
            </Field>
          </FieldGrid>
          <Field>
            <span>{behavior.caretLabel}</span>
            <input
              type="checkbox"
              checked={behavior.activeStyle.hasCaret}
              onChange={behavior.onCaretChange}
            />
          </Field>
          <InheritanceHint>{behavior.inheritScaleLabel}</InheritanceHint>
          <FieldGrid>
            <Field>
              <span>{behavior.scaleLabel}</span>
              <input
                type="number"
                min="25"
                max="400"
                step="1"
                value={behavior.phraseScaleInputValue}
                placeholder={behavior.inheritedPhraseScalePlaceholder}
                onChange={behavior.onPhraseScaleInput}
                onBlur={behavior.onPhraseScaleBlur}
              />
            </Field>
            <Field>
              <span>{behavior.readAnimationLabel}</span>
              <select
                value={behavior.phraseCurve}
                onChange={behavior.onPhraseCurveChange}
              >
                <ForEach
                  data={behavior.phraseCurveOptions}
                  idCompute={behavior.getCurveOptionId}
                  render={behavior.renderCurveOption}
                />
              </select>
            </Field>
          </FieldGrid>
          <Render when={behavior.showPhraseBezierEditor}>
            <CubicBezierEditor
              value={behavior.phraseCurve}
              labels={behavior.bezierLabels}
              onChange={behavior.onPhraseBezierChange}
            />
          </Render>
        </Render>
        <Render when={behavior.selectedWord !== null}>
          <SectionTitle>{behavior.wordStyleLabel}</SectionTitle>
          <InheritanceHint>{behavior.inheritScaleLabel}</InheritanceHint>
          <FieldGrid>
            <Field>
              <span>{behavior.scaleLabel}</span>
              <input
                type="number"
                min="25"
                max="400"
                step="1"
                value={behavior.wordScaleInputValue}
                placeholder={behavior.inheritedWordScalePlaceholder}
                onChange={behavior.onWordScaleInput}
                onBlur={behavior.onWordScaleBlur}
              />
            </Field>
            <Field>
              <span>{behavior.readAnimationLabel}</span>
              <select
                value={behavior.wordCurve}
                onChange={behavior.onWordCurveChange}
              >
                <ForEach
                  data={behavior.wordCurveOptions}
                  idCompute={behavior.getCurveOptionId}
                  render={behavior.renderCurveOption}
                />
              </select>
            </Field>
          </FieldGrid>
          <Render when={behavior.showWordBezierEditor}>
            <CubicBezierEditor
              value={behavior.wordCurve}
              labels={behavior.bezierLabels}
              onChange={behavior.onWordBezierChange}
            />
          </Render>
        </Render>
        <Render when={behavior.showStyleEmpty}>
          <InspectorEmpty>{behavior.emptyInspector}</InspectorEmpty>
        </Render>
      </Render>
      <Render when={behavior.animationActive}>
        <AnimationPanel>
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
        </AnimationPanel>
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
