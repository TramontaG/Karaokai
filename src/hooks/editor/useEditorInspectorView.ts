import { type ChangeEvent } from "react";
import { type SubtitleWord } from "../../domain/project";
import { type SubtitleFontOption } from "../../services/subtitleFonts";
import { formatTime } from "../../util/editor/numbers";
import { type CurveOption, type TimelineRow } from "../../util/editor/types";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRenderKeys } from "./useEditorRenderKeys";
import type { EditorTracks } from "./useEditorTracks";
import type { SubtitleColorPreview } from "./useSubtitleColorPreview";
import type { SubtitlePhraseActions } from "./useSubtitlePhraseActions";
import type { SubtitleRendering } from "./useSubtitleRendering";
import type { SubtitleSelection } from "./useSubtitleSelection";
import type { SubtitleStyles } from "./useSubtitleStyles";
import type { SubtitleStyleValues } from "./useSubtitleStyleValues";
import type { SubtitleTextEditing } from "./useSubtitleTextEditing";
import type { SubtitleTiming } from "./useSubtitleTiming";
import type { TimelineRendering } from "./useTimelineRendering";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    | "error"
    | "selectedTrackId"
    | "trackScaleInputValue"
    | "phraseScaleInputValue"
    | "wordScaleInputValue"
    | "inspectorTab"
    | "setTrackScaleInputValue"
    | "setPhraseScaleInputValue"
    | "setWordScaleInputValue"
    | "setSelectedWordId"
    | "setInspectorTab"
  >;
  subtitleSelection: Pick<
    SubtitleSelection,
    "activePhrase" | "selectedWord" | "animationTemplate"
  >;
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  editorTracks: Pick<
    EditorTracks,
    | "trackPendingDeletion"
    | "onSelectTrack"
    | "onRenameTrack"
    | "onRequestDeleteTrack"
    | "onConfirmDeleteTrack"
    | "onCancelDeleteTrack"
    | "onAddSubtitleTrack"
  >;
  subtitleStyleValues: Pick<
    SubtitleStyleValues,
    | "trackPositionX"
    | "trackPositionY"
    | "inheritedPhraseScalePercentage"
    | "inheritedWordScalePercentage"
    | "trackCurve"
    | "phraseCurve"
    | "wordCurve"
    | "trackCurveOptions"
    | "phraseCurveOptions"
    | "wordCurveOptions"
    | "showTrackBezierEditor"
    | "showPhraseBezierEditor"
    | "showWordBezierEditor"
    | "trackStyle"
    | "fontOptions"
    | "phraseStyle"
    | "wordStyle"
    | "renderCurveOption"
    | "trackScalePercentage"
    | "storedPhraseScaleInputValue"
    | "storedWordScaleInputValue"
  >;
  editorEnvironment: Pick<EditorEnvironment, "t">;
  timelineRendering: Pick<
    TimelineRendering,
    "renderTimelineLabel" | "renderTimelineRow"
  >;
  subtitleRendering: Pick<SubtitleRendering, "renderWord">;
  editorRenderKeys: Pick<
    EditorRenderKeys,
    "sidebarRenderKey" | "headerRenderKey"
  >;
  subtitleTextEditing: Pick<
    SubtitleTextEditing,
    | "onUpdatePhraseText"
    | "onUpdateInspectorWordText"
    | "onInsertInspectorGap"
    | "onDeleteInspectorWord"
  >;
  subtitleStyles: Pick<
    SubtitleStyles,
    | "updateScopedStyle"
    | "resetScopedColor"
    | "commitScaleInput"
    | "updateReadCurve"
    | "onUpdateTrackPosition"
    | "onAnimationTemplateChange"
  >;
  subtitleColorPreview: Pick<
    SubtitleColorPreview,
    "onPreviewScopedColor" | "clearColorPreview"
  >;
  subtitleTiming: Pick<
    SubtitleTiming,
    "updatePhraseTime" | "updateWordTime" | "updateInspectorWordTime"
  >;
  subtitlePhraseActions: Pick<
    SubtitlePhraseActions,
    "onInsertPhrase" | "onDeletePhrase"
  >;
}

export function useEditorInspectorView({
  editorDataState,
  subtitleSelection,
  editorProjectValues,
  editorTracks,
  subtitleStyleValues,
  editorEnvironment,
  timelineRendering,
  subtitleRendering,
  editorRenderKeys,
  subtitleTextEditing,
  subtitleStyles,
  subtitleColorPreview,
  subtitleTiming,
  subtitlePhraseActions,
}: Options) {
  const {
    error,
    selectedTrackId,
    trackScaleInputValue,
    phraseScaleInputValue,
    wordScaleInputValue,
    inspectorTab,
    setTrackScaleInputValue,
    setPhraseScaleInputValue,
    setWordScaleInputValue,
    setSelectedWordId,
    setInspectorTab,
  } = editorDataState;
  const { activePhrase, selectedWord, animationTemplate } = subtitleSelection;
  const { subtitleTrack } = editorProjectValues;
  const {
    trackPendingDeletion,
    onSelectTrack,
    onRenameTrack,
    onRequestDeleteTrack,
    onConfirmDeleteTrack,
    onCancelDeleteTrack,
    onAddSubtitleTrack,
  } = editorTracks;
  const {
    trackPositionX,
    trackPositionY,
    inheritedPhraseScalePercentage,
    inheritedWordScalePercentage,
    trackCurve,
    phraseCurve,
    wordCurve,
    trackCurveOptions,
    phraseCurveOptions,
    wordCurveOptions,
    showTrackBezierEditor,
    showPhraseBezierEditor,
    showWordBezierEditor,
    trackStyle,
    fontOptions,
    phraseStyle,
    wordStyle,
    renderCurveOption,
    trackScalePercentage,
    storedPhraseScaleInputValue,
    storedWordScaleInputValue,
  } = subtitleStyleValues;
  const { t } = editorEnvironment;
  const { renderTimelineLabel, renderTimelineRow } = timelineRendering;
  const { renderWord } = subtitleRendering;
  const { sidebarRenderKey, headerRenderKey } = editorRenderKeys;
  const {
    onUpdatePhraseText,
    onUpdateInspectorWordText,
    onInsertInspectorGap,
    onDeleteInspectorWord,
  } = subtitleTextEditing;
  const {
    updateScopedStyle,
    resetScopedColor,
    commitScaleInput,
    updateReadCurve,
    onUpdateTrackPosition,
    onAnimationTemplateChange,
  } = subtitleStyles;
  const { onPreviewScopedColor, clearColorPreview } = subtitleColorPreview;
  const { updatePhraseTime, updateWordTime, updateInspectorWordTime } =
    subtitleTiming;
  const { onInsertPhrase, onDeletePhrase } = subtitlePhraseActions;
  return {
    error,
    activePhrase,
    selectedWord,
    selectedTrackId,
    animationTemplate,
    selectedSubtitleTrack: subtitleTrack,
    trackDeleteDialogOpen: trackPendingDeletion !== null,
    trackPositionX,
    trackPositionY,
    trackScaleInputValue,
    phraseScaleInputValue,
    wordScaleInputValue,
    inheritedPhraseScalePlaceholder: String(inheritedPhraseScalePercentage),
    inheritedWordScalePlaceholder: String(inheritedWordScalePercentage),
    trackCurve,
    phraseCurve,
    wordCurve,
    trackCurveOptions,
    phraseCurveOptions,
    wordCurveOptions,
    showTrackBezierEditor,
    showPhraseBezierEditor,
    showWordBezierEditor,
    inspectorWords: activePhrase?.words ?? [],
    trackStyle,
    fontOptions,
    phraseStyle,
    wordStyle,
    phrasePositionX: activePhrase?.style?.x ?? 0,
    phrasePositionY: activePhrase?.style?.y ?? 0,
    wordPositionX: selectedWord?.style?.x ?? 0,
    wordPositionY: selectedWord?.style?.y ?? 0,
    trackTabActive: inspectorTab === "track",
    phraseTabActive: inspectorTab === "phrase",
    wordTabActive: inspectorTab === "word",
    pointerToolLabel: t("editor.pointerTool"),
    beatOffsetLabel: t("editor.beatOffset"),
    tracksLabel: t("editor.tracks"),
    addSubtitleTrackLabel: t("editor.addSubtitleTrack"),
    trackPositionLabel: t("editor.trackPosition"),
    deleteTrackLabel: t("editor.deleteTrack"),
    deleteTrackTitle: t("editor.deleteTrackTitle"),
    deleteTrackDescription: t(
      trackPendingDeletion?.phrases.length === 1
        ? "editor.deleteTrackDescription.one"
        : "editor.deleteTrackDescription.many",
      {
        track: trackPendingDeletion?.name ?? "",
        count: String(trackPendingDeletion?.phrases.length ?? 0),
      }
    ),
    deleteTrackConfirmLabel: t("editor.deleteTrackConfirm"),
    deleteTrackCancelLabel: t("editor.deleteTrackCancel"),
    deleteTrackCloseLabel: t("editor.deleteTrackClose"),
    mixerLabel: t("editor.mixer"),
    animationTemplateLabel: t("editor.animationTemplate"),
    animationTemplateOneLabel: t("editor.animationTemplateOne"),
    animationTemplateOneDescription: t(
      "editor.animationTemplateOneDescription"
    ),
    deletePhraseLabel: t("editor.deletePhrase"),
    deletePhraseShortcut: t("editor.deletePhraseShortcut"),
    deleteKeyLabel: t("editor.deleteKey"),
    textLabel: t("editor.text"),
    startLabel: t("editor.start"),
    endLabel: t("editor.end"),
    unreadLabel: t("editor.unreadColor"),
    readLabel: t("editor.readColor"),
    positionXLabel: t("editor.positionX"),
    positionYLabel: t("editor.positionY"),
    trackStyleLabel: t("editor.trackStyle"),
    phraseStyleLabel: t("editor.phraseStyle"),
    wordStyleLabel: t("editor.wordStyle", {
      word: selectedWord?.text ?? "",
    }),
    scaleLabel: t("editor.scale"),
    fontFamilyLabel: t("editor.fontFamily"),
    fontStyleLabel: t("editor.fontStyle"),
    boldLabel: t("editor.bold"),
    italicLabel: t("editor.italic"),
    underlineLabel: t("editor.underline"),
    superscriptLabel: t("editor.superscript"),
    subscriptLabel: t("editor.subscript"),
    readAnimationLabel: t("editor.readAnimation"),
    inheritScaleLabel: t("editor.inheritScale"),
    inheritLabel: t("editor.inherit"),
    bezierLabels: {
      title: t("editor.bezier.title"),
      p1x: t("editor.bezier.p1x"),
      p1y: t("editor.bezier.p1y"),
      p2x: t("editor.bezier.p2x"),
      p2y: t("editor.bezier.p2y"),
    },
    wordsLabel: t("editor.words", {
      count: String(activePhrase?.words.length ?? 0),
    }),
    wordTextLabel: t("editor.wordText"),
    gapLabel: t("editor.gap"),
    insertGapLabel: t("editor.insertGap"),
    deleteWordLabel: t("editor.deleteWord"),
    mixerDescription: t("editor.mixerDescription"),
    titleClipLabel: t("editor.track.text"),
    audioClipLabel: t("editor.track.audio"),
    formattedStart: formatTime(activePhrase?.start ?? 0),
    formattedEnd: formatTime(activePhrase?.end ?? 0),
    renderTimelineLabel,
    renderTimelineRow,
    renderWord,
    renderCurveOption,
    sidebarRenderKey,
    headerRenderKey,
    getWordId: (word: SubtitleWord) => word.id,
    getTimelineRowId: (row: TimelineRow) => row.id,
    getCurveOptionId: (option: CurveOption) => option.id,
    getFontOptionId: (option: SubtitleFontOption) => option.id,
    onPhraseTextCommit: onUpdatePhraseText,
    onTrackStyleChange: updateScopedStyle.bind(null, "track"),
    onPhraseStyleChange: updateScopedStyle.bind(null, "phrase"),
    onWordStyleChange: updateScopedStyle.bind(null, "word"),
    onTrackColorPreview: onPreviewScopedColor.bind(null, "track"),
    onPhraseColorPreview: onPreviewScopedColor.bind(null, "phrase"),
    onWordColorPreview: onPreviewScopedColor.bind(null, "word"),
    onColorPreviewEnd: clearColorPreview,
    onPhraseColorInherit: resetScopedColor.bind(null, "phrase"),
    onWordColorInherit: resetScopedColor.bind(null, "word"),
    onPhraseStyleInherit: resetScopedColor.bind(null, "phrase"),
    onWordStyleInherit: resetScopedColor.bind(null, "word"),
    onTrackScaleInput: setTrackScaleInputValue,
    onPhraseScaleInput: setPhraseScaleInputValue,
    onWordScaleInput: setWordScaleInputValue,
    onTrackScaleBlur: () =>
      commitScaleInput(
        "track",
        trackScaleInputValue,
        String(trackScalePercentage),
        setTrackScaleInputValue
      ),
    onPhraseScaleBlur: () =>
      commitScaleInput(
        "phrase",
        phraseScaleInputValue,
        storedPhraseScaleInputValue,
        setPhraseScaleInputValue
      ),
    onWordScaleBlur: () =>
      commitScaleInput(
        "word",
        wordScaleInputValue,
        storedWordScaleInputValue,
        setWordScaleInputValue
      ),
    onTrackCurveChange: (event: ChangeEvent<HTMLSelectElement>) =>
      updateReadCurve("track", event.target.value),
    onPhraseCurveChange: (event: ChangeEvent<HTMLSelectElement>) =>
      updateReadCurve("phrase", event.target.value),
    onWordCurveChange: (event: ChangeEvent<HTMLSelectElement>) =>
      updateReadCurve("word", event.target.value),
    onTrackBezierChange: (value: string) => updateReadCurve("track", value),
    onPhraseBezierChange: (value: string) => updateReadCurve("phrase", value),
    onWordBezierChange: (value: string) => updateReadCurve("word", value),
    onTrackXInput: (event: ChangeEvent<HTMLInputElement>) =>
      onUpdateTrackPosition("x", Number(event.target.value)),
    onTrackYInput: (event: ChangeEvent<HTMLInputElement>) =>
      onUpdateTrackPosition("y", Number(event.target.value)),
    onPhraseStartInput: (value: string) =>
      updatePhraseTime("start", Number(value) * 1000),
    onPhraseEndInput: (value: string) =>
      updatePhraseTime("end", Number(value) * 1000),
    onWordStartInput: (value: string) =>
      updateWordTime("start", Number(value) * 1000),
    onWordEndInput: (value: string) =>
      updateWordTime("end", Number(value) * 1000),
    onInspectorWordSelect: (wordId: string) => setSelectedWordId(wordId),
    onInspectorWordStartInput: (wordId: string, value: string) =>
      updateInspectorWordTime(wordId, "start", Number(value) * 1000),
    onInspectorWordEndInput: (wordId: string, value: string) =>
      updateInspectorWordTime(wordId, "end", Number(value) * 1000),
    onInspectorWordTextInput: onUpdateInspectorWordText,
    onInsertInspectorGap,
    onDeleteInspectorWord,
    onAnimationTemplateChange,
    onSelectTrack,
    onRenameTrack,
    onInsertPhrase,
    onDeletePhrase,
    onRequestDeleteTrack,
    onConfirmDeleteTrack,
    onCancelDeleteTrack,
    onAddSubtitleTrack,
    onShowTrackTab: () => setInspectorTab("track"),
    onShowPhraseTab: () => setInspectorTab("phrase"),
    onShowWordTab: () => setInspectorTab("word"),
  };
}

export type EditorInspectorView = ReturnType<typeof useEditorInspectorView>;
