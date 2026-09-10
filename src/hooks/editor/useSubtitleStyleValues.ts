import { createElement, useCallback, useEffect, useMemo } from "react";
import { parseCubicBezier, resolveSubtitleStyle } from "../../domain/project";
import { subtitleFontOptions } from "../../services/subtitleFonts";
import { curveOptionsWithCurrent } from "../../util/editor/subtitleStyles";
import { type CurveOption } from "../../util/editor/types";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { SubtitleSelection } from "./useSubtitleSelection";

interface Options {
  editorProjectValues: Pick<EditorProjectValues, "subtitleTrack">;
  subtitleSelection: Pick<SubtitleSelection, "activePhrase" | "selectedWord">;
  editorEnvironment: Pick<EditorEnvironment, "t" | "data">;
  editorDataState: Pick<
    EditorDataState,
    | "setTrackScaleInputValue"
    | "setPhraseScaleInputValue"
    | "setWordScaleInputValue"
  >;
}

export function useSubtitleStyleValues({
  editorProjectValues,
  subtitleSelection,
  editorEnvironment,
  editorDataState,
}: Options) {
  const { subtitleTrack } = editorProjectValues;
  const { activePhrase, selectedWord } = subtitleSelection;
  const { t, data } = editorEnvironment;
  const {
    setTrackScaleInputValue,
    setPhraseScaleInputValue,
    setWordScaleInputValue,
  } = editorDataState;
  const trackScalePercentage = Math.round(
    (subtitleTrack?.style.scale ?? 1) * 100
  );

  const storedPhraseScaleInputValue =
    activePhrase?.style?.scale === undefined
      ? ""
      : String(Math.round(activePhrase.style.scale * 100));

  const storedWordScaleInputValue =
    selectedWord?.style?.scale === undefined
      ? ""
      : String(Math.round(selectedWord.style.scale * 100));

  const inheritedPhraseScalePercentage = trackScalePercentage;

  const inheritedWordScalePercentage = Math.round(
    (activePhrase?.style?.scale ?? subtitleTrack?.style.scale ?? 1) * 100
  );

  const trackCurve = subtitleTrack?.curve ?? "linear";

  const phraseCurve = activePhrase?.curve ?? "inherit";

  const wordCurve = selectedWord?.curve ?? "inherit";

  const showTrackBezierEditor = parseCubicBezier(trackCurve) !== null;

  const showPhraseBezierEditor = parseCubicBezier(phraseCurve) !== null;

  const showWordBezierEditor = parseCubicBezier(wordCurve) !== null;

  const curvePresetOptions = useMemo<CurveOption[]>(
    () => [
      { id: "none", label: t("editor.readCurve.none") },
      { id: "linear", label: t("editor.readCurve.linear") },
      { id: "ease", label: t("editor.readCurve.ease") },
      { id: "ease-in", label: t("editor.readCurve.easeIn") },
      { id: "ease-out", label: t("editor.readCurve.easeOut") },
      { id: "ease-in-out", label: t("editor.readCurve.easeInOut") },
      {
        id: "cubic-bezier(0.27, 0.12, 0.19, 0.91)",
        label: t("editor.readCurve.cubicBezier"),
      },
    ],
    [t]
  );

  const curveOverrideOptions = useMemo(
    () => [
      { id: "inherit", label: t("editor.inherit") },
      ...curvePresetOptions,
    ],
    [curvePresetOptions, t]
  );

  const trackCurveOptions = useMemo(
    () => curveOptionsWithCurrent(curvePresetOptions, trackCurve),
    [curvePresetOptions, trackCurve]
  );

  const phraseCurveOptions = useMemo(
    () => curveOptionsWithCurrent(curveOverrideOptions, phraseCurve),
    [curveOverrideOptions, phraseCurve]
  );

  const wordCurveOptions = useMemo(
    () => curveOptionsWithCurrent(curveOverrideOptions, wordCurve),
    [curveOverrideOptions, wordCurve]
  );

  useEffect(
    () => setTrackScaleInputValue(String(trackScalePercentage)),
    [trackScalePercentage]
  );

  useEffect(
    () => setPhraseScaleInputValue(storedPhraseScaleInputValue),
    [activePhrase?.id, storedPhraseScaleInputValue]
  );

  useEffect(
    () => setWordScaleInputValue(storedWordScaleInputValue),
    [selectedWord?.id, storedWordScaleInputValue]
  );

  const trackStyle = resolveSubtitleStyle(subtitleTrack?.style ?? {});

  const availableFontOptions = subtitleFontOptions(
    data.preferences.customFonts
  );

  const fontOptions = availableFontOptions.some(
    (font) => font.id === trackStyle.fontFamily
  )
    ? availableFontOptions
    : [
        ...availableFontOptions,
        { id: trackStyle.fontFamily, name: trackStyle.fontFamily },
      ];

  const phraseStyle = resolveSubtitleStyle(
    subtitleTrack?.style ?? {},
    activePhrase?.style
  );

  const wordStyle = resolveSubtitleStyle(
    subtitleTrack?.style ?? {},
    activePhrase?.style,
    selectedWord?.style
  );

  const trackPositionX = subtitleTrack?.style.x ?? 0;

  const trackPositionY = subtitleTrack?.style.y ?? 0;

  const renderCurveOption = useCallback(
    (option: CurveOption) =>
      createElement("option", { value: option.id }, option.label),
    []
  );
  return {
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
  };
}

export type SubtitleStyleValues = ReturnType<typeof useSubtitleStyleValues>;
