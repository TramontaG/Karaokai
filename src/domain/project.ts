export type TrackType = "audio" | "background" | "subtitle" | "image" | "text";

export interface TimedElement {
  start: number;
  end: number;
}

export interface SubtitleStyle {
  unreadColor?: string;
  readColor?: string;
  scale?: number;
  x?: number;
  y?: number;
  hasCaret?: boolean;
}

export interface BaseTrack {
  id: string;
  type: TrackType;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  source: string;
  volume: number;
  vocalsVolume?: number;
  muted: boolean;
}

export interface SubtitleWord extends TimedElement {
  id: string;
  text: string;
  curve?: string;
  style?: SubtitleStyle;
}

export interface SubtitlePhrase extends TimedElement {
  id: string;
  text: string;
  style?: SubtitleStyle;
  curve?: string;
  words: SubtitleWord[];
}

export type SubtitleAnimationTemplate = "template-1";

export interface SubtitleAnimation {
  template: SubtitleAnimationTemplate;
}

export interface SubtitleTrack extends BaseTrack {
  type: "subtitle";
  style: SubtitleStyle;
  curve?: string;
  animation?: SubtitleAnimation;
  phrases: SubtitlePhrase[];
}

/**
 * Subtitle tracks store phrases in ascending start/end order. Keep this
 * invariant whenever timing or membership changes so playback can consume the
 * collection without sorting during a frame.
 */
export function sortSubtitlePhrases(phrases: SubtitlePhrase[]) {
  return [...phrases].sort(
    (left, right) => left.start - right.start || left.end - right.end
  );
}

export function normalizeSubtitlePhraseOrder(project: KaraokeProject) {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.type === "subtitle"
        ? { ...track, phrases: sortSubtitlePhrases(track.phrases) }
        : track
    ),
  };
}

export type ProjectTrack =
  | AudioTrack
  | SubtitleTrack
  | (BaseTrack & { type: "background" | "image" | "text" });

export interface ProjectStage {
  id: "import" | "separation" | "transcription" | "subtitles";
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  modelId?: string;
  progress?: number;
}

export interface ProjectTempo {
  bpm: number;
  offset: number;
}

export interface KaraokeProject {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  tempo?: ProjectTempo;
  tracks: ProjectTrack[];
  processing: ProjectStage[];
}

export function resolveSubtitleStyle(
  track: SubtitleStyle,
  phrase?: SubtitleStyle,
  word?: SubtitleStyle
): Required<SubtitleStyle> {
  return {
    unreadColor:
      word?.unreadColor ??
      phrase?.unreadColor ??
      track.unreadColor ??
      "#FFFFFF",
    readColor:
      word?.readColor ?? phrase?.readColor ?? track.readColor ?? "#FF0044",
    scale: word?.scale ?? phrase?.scale ?? track.scale ?? 1,
    x: (track.x ?? 0) + (phrase?.x ?? 0) + (word?.x ?? 0),
    y: (track.y ?? 0) + (phrase?.y ?? 0) + (word?.y ?? 0),
    hasCaret: word?.hasCaret ?? phrase?.hasCaret ?? track.hasCaret ?? false,
  };
}

export function resolveTimingCurve(
  track?: string,
  phrase?: string,
  word?: string
) {
  return word ?? phrase ?? track ?? "linear";
}

const curvePresets: Record<string, readonly [number, number, number, number]> =
  {
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };

const cubicBezierPattern =
  /^cubic-bezier\(\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\)$/i;

export type CubicBezierPoints = [number, number, number, number];

export function parseCubicBezier(curve: string): CubicBezierPoints | null {
  const match = curve.match(cubicBezierPattern);
  if (!match) return null;
  const values = match.slice(1).map(Number);
  if (values.length !== 4 || values.some(Number.isNaN)) return null;
  return values as CubicBezierPoints;
}

export function formatCubicBezier(points: CubicBezierPoints) {
  return `cubic-bezier(${points.join(", ")})`;
}

function cubicBezierCoordinate(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * first + 3 * inverse * t * t * second + t * t * t
  );
}

function cubicBezierDerivative(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * first +
    6 * inverse * t * (second - first) +
    3 * t * t * (1 - second)
  );
}

function cubicBezierProgress(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  let parameter = progress;
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const error = cubicBezierCoordinate(parameter, x1, x2) - progress;
    const derivative = cubicBezierDerivative(parameter, x1, x2);
    if (Math.abs(error) < 0.000001) break;
    if (Math.abs(derivative) < 0.000001) break;
    parameter -= error / derivative;
  }

  if (parameter < 0 || parameter > 1) {
    let minimum = 0;
    let maximum = 1;
    parameter = progress;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      if (cubicBezierCoordinate(parameter, x1, x2) < progress) {
        minimum = parameter;
      } else {
        maximum = parameter;
      }
      parameter = (minimum + maximum) / 2;
    }
  }

  return Math.min(1, Math.max(0, cubicBezierCoordinate(parameter, y1, y2)));
}

export function timingCurveProgress(curve: string, progress: number) {
  const normalized = Math.min(1, Math.max(0, progress));
  if (normalized === 0 || normalized === 1 || curve === "linear") {
    return normalized;
  }
  const preset = curvePresets[curve];
  const values = preset ?? parseCubicBezier(curve);
  if (!values || values.length !== 4 || values.some(Number.isNaN)) {
    return normalized;
  }
  const [rawX1, y1, rawX2, y2] = values;
  return cubicBezierProgress(
    normalized,
    Math.min(1, Math.max(0, rawX1)),
    y1,
    Math.min(1, Math.max(0, rawX2)),
    y2
  );
}

export function wordProgress(word: SubtitleWord, currentTime: number) {
  if (word.end <= word.start) return currentTime >= word.end ? 1 : 0;
  return Math.min(
    1,
    Math.max(0, (currentTime - word.start) / (word.end - word.start))
  );
}

export function wordReadProgress(
  word: SubtitleWord,
  currentTime: number,
  curve: string
) {
  if (curve === "none") return currentTime >= word.start ? 1 : 0;
  return timingCurveProgress(curve, wordProgress(word, currentTime));
}
