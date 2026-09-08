import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Image,
  LoaderCircle,
  Music2,
  Subtitles,
  Type,
} from "lucide-react";
import { flushSync } from "react-dom";
import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  parseCubicBezier,
  resolveSubtitleStyle,
  resolveTimingCurve,
  subtitleFontStack,
  wordReadProgress,
  type AudioTrack,
  type BackgroundPreset,
  type BackgroundTrack,
  type KaraokeProject,
  type ProjectTrack,
  type SubtitleAnimationTemplate,
  type SubtitleStyle,
  type SubtitlePhrase,
  type SubtitleTrack,
  type SubtitleWord,
  normalizeSubtitlePhraseOrder,
  createProjectThumbnail,
  sortSubtitlePhrases,
} from "../../domain/project";
import { useAppContext } from "../../hooks/useAppContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useTimelineAutoFollow } from "../../hooks/useTimelineAutoFollow";
import {
  chooseBackgroundFile,
  chooseVideoDestination,
  isDesktop,
  listenDesktop,
  windowAction,
} from "../../services/desktop";
import {
  extractAlbumArt,
  importBackgroundAsset,
  loadProject,
  projectAudioSources,
  readProjectAudio,
  readProjectAsset,
  cancelProjectRender,
  saveProject,
  saveProjectThumbnail,
  startProjectRender,
  type ProjectRenderProgress,
} from "../../services/projects";
import {
  registerBeforeWindowClose,
  saveProjectBeforeWindowClose,
} from "../../services/projectWindowLifecycle";
import {
  subtitleFontOptions,
  type SubtitleFontOption,
} from "../../services/subtitleFonts";
import { PhraseClip } from "./components/PhraseClip";
import {
  useEditorData,
  type EditorData,
  type EditorInspectorTab,
  type TimelineTool,
} from "./components/EditorState";
import {
  createPhraseAt,
  duplicatePhraseAt,
  insertGapAfterWord,
  movePhrase,
  moveWordWithinPhrase,
  phraseEntryCueProgress,
  resizePhraseEnd,
  resizePhraseStart,
  resizeWordBoundary,
  replacePhraseWordText,
  removePhraseWord,
  splitPhraseAtClosestWordBoundary,
  subtitlePreviewAt,
  timeAtTimelinePosition,
  timelineFollowScrollLeft,
  wordsForText,
} from "./timeline";
import {
  CurrentPhrase,
  EntryCue,
  EntryCueBar,
  EntryCueBarFill,
  NextPhrase,
  PreviewWord,
  PreviewWordFill,
  SubtitlePreview,
  TimelineClip,
  TimelineLabel,
  TimelineLane,
  WordRow,
} from "./styles";

type InspectorTab = EditorInspectorTab;
type PhraseGesture = "move" | "start" | "end";
type SubtitlePropertyScope = "track" | "phrase" | "word";
type CurveOption = { id: string; label: string };
type EditorHistoryEntry = {
  project: KaraokeProject;
  selectedTrackId: string | null;
  selectedPhraseId: string | null;
  selectedWordId: string | null;
};

type TimelineRow = {
  id: string;
  type: ProjectTrack["type"];
  label: string;
  Icon: typeof Image;
  track: ProjectTrack | null;
};

const HISTORY_LIMIT = 100;
const DEFAULT_BPM = 120;
const MINIMUM_BPM = 20;
const MAXIMUM_BPM = 400;
const MINIMUM_SCALE_PERCENTAGE = 25;
const MAXIMUM_SCALE_PERCENTAGE = 400;
const VOCALS_HARD_SYNC_THRESHOLD = 0.25;
const VOCALS_HARD_SYNC_INTERVAL = 1_000;
const VOCALS_SYNC_RATE_ADJUSTMENT = 0.04;

const isSubtitleTrack = (
  track: KaraokeProject["tracks"][number] | null | undefined
): track is SubtitleTrack => track?.type === "subtitle";
const isAudioTrack = (
  track: KaraokeProject["tracks"][number]
): track is AudioTrack => track.type === "audio";
const isBackgroundTrack = (
  track: KaraokeProject["tracks"][number] | null | undefined
): track is BackgroundTrack => track?.type === "background";
const formatTime = (milliseconds: number) =>
  new Date(Math.max(0, milliseconds)).toISOString().slice(14, 23);
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function drawMediaBackground(
  context: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  fit: "cover" | "contain"
) {
  const width =
    media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const height =
    media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  if (!width || !height) return;
  const scale =
    fit === "contain"
      ? Math.min(context.canvas.width / width, context.canvas.height / height)
      : Math.max(context.canvas.width / width, context.canvas.height / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  context.drawImage(
    media,
    (context.canvas.width - renderedWidth) / 2,
    (context.canvas.height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight
  );
}

function waitForVideoSeek(video: HTMLVideoElement, seconds: number) {
  return new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - seconds) < 0.01) {
      resolve();
      return;
    }
    const finish = () => {
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish, { once: true });
    video.currentTime = seconds;
  });
}

function jpegBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
}

function optionalStyleScale(
  style: SubtitlePhrase["style"],
  scale: number | undefined
) {
  const next = { ...style };
  if (scale === undefined) delete next.scale;
  else next.scale = scale;
  return Object.keys(next).length > 0 ? next : undefined;
}

function withoutStyleProperty(
  style: SubtitlePhrase["style"],
  property: keyof SubtitleStyle | "typography"
) {
  const next = { ...style };
  if (property === "typography") {
    delete next.fontFamily;
    delete next.fontWeight;
    delete next.fontStyle;
    delete next.textDecoration;
    delete next.verticalAlign;
  } else {
    delete next[property];
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function curveOptionsWithCurrent(options: CurveOption[], currentCurve: string) {
  if (
    currentCurve === "inherit" ||
    options.some((option) => option.id === currentCurve)
  ) {
    return options;
  }
  return [...options, { id: currentCurve, label: currentCurve }];
}

function replacePhrase(
  project: KaraokeProject,
  trackId: string,
  phraseId: string,
  nextPhrase: SubtitlePhrase
) {
  return {
    ...project,
    updatedAt: String(Date.now()),
    tracks: project.tracks.map((track) =>
      track.type !== "subtitle" || track.id !== trackId
        ? track
        : {
            ...track,
            phrases: sortSubtitlePhrases(
              track.phrases.map((phrase) =>
                phrase.id === phraseId ? nextPhrase : phrase
              )
            ),
          }
    ),
  };
}

function movePhraseToSubtitleTrack(
  project: KaraokeProject,
  sourceTrackId: string,
  targetTrackId: string,
  phraseId: string,
  nextPhrase: SubtitlePhrase
) {
  return {
    ...project,
    updatedAt: String(Date.now()),
    tracks: project.tracks.map((track) => {
      if (track.type !== "subtitle") return track;
      if (track.id === sourceTrackId)
        return {
          ...track,
          phrases: track.phrases.filter((phrase) => phrase.id !== phraseId),
        };
      if (track.id === targetTrackId)
        return {
          ...track,
          phrases: sortSubtitlePhrases([...track.phrases, nextPhrase]),
        };
      return track;
    }),
  };
}

function subtitleTrackIdAtPosition(clientY: number) {
  const lanes = document.querySelectorAll<HTMLElement>(
    "[data-subtitle-track-id]"
  );
  const target = [...lanes].find((lane) => {
    const bounds = lane.getBoundingClientRect();
    return clientY >= bounds.top && clientY <= bounds.bottom;
  });
  return target?.dataset.subtitleTrackId ?? null;
}

function subtitlePreviewView(track: SubtitleTrack, currentTime: number) {
  const timing = subtitlePreviewAt(
    track.phrases,
    currentTime,
    track.animation?.template ?? "template-1"
  );
  const playingPhrase = timing.currentPhrase;
  const entryCuePhrase =
    playingPhrase ??
    [timing.primaryPhrase, timing.secondaryPhrase].find(
      (phrase) => phrase !== null && phrase.start > currentTime
    ) ??
    null;
  const entryCueProgress = phraseEntryCueProgress(entryCuePhrase, currentTime);
  const entryCueColors = resolveSubtitleStyle(
    track.style,
    entryCuePhrase?.style,
    entryCuePhrase?.words[0]?.style
  );
  const positionReferenceWidth = track.style.positionReferenceWidth ?? 640;
  const positionReferenceHeight = track.style.positionReferenceHeight ?? 360;
  const words = (timing.primaryPhrase?.words ?? [])
    .filter((word) => word.type !== "gap")
    .map((word) => {
      const style = resolveSubtitleStyle(
        track.style,
        timing.primaryPhrase?.style,
        word.style
      );
      return {
        ...word,
        progress: timing.primaryFullyRead
          ? 1
          : wordReadProgress(
              word,
              currentTime,
              resolveTimingCurve(
                track.curve,
                timing.primaryPhrase?.curve,
                word.curve
              )
            ),
        readColor: style.readColor,
        unreadColor: style.unreadColor,
        scale: style.scale,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textDecoration: style.textDecoration,
        verticalAlign: style.verticalAlign,
        unreadColorSource: subtitleColorSource(
          "unreadColor",
          track.style,
          timing.primaryPhrase?.style,
          word.style
        ),
        readColorSource: subtitleColorSource(
          "readColor",
          track.style,
          timing.primaryPhrase?.style,
          word.style
        ),
      };
    });
  const secondaryWords = (timing.secondaryPhrase?.words ?? [])
    .filter((word) => word.type !== "gap")
    .map((word) => {
      const style = resolveSubtitleStyle(
        track.style,
        timing.secondaryPhrase?.style,
        word.style
      );
      return {
        ...word,
        progress: 0,
        readColor: style.readColor,
        unreadColor: style.unreadColor,
        scale: style.scale,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textDecoration: style.textDecoration,
        verticalAlign: style.verticalAlign,
        unreadColorSource: subtitleColorSource(
          "unreadColor",
          track.style,
          timing.secondaryPhrase?.style,
          word.style
        ),
        readColorSource: subtitleColorSource(
          "readColor",
          track.style,
          timing.secondaryPhrase?.style,
          word.style
        ),
      };
    });

  return {
    id: track.id,
    timing,
    playingPhrase,
    entryCuePhrase,
    words,
    secondaryWords,
    visible:
      track.visible && (words.length > 0 || timing.secondaryPhrase !== null),
    containerStyle: {
      left: `calc(50% + ${((track.style.x ?? 0) / positionReferenceWidth) * 100}%)`,
      top: `calc(50% + ${((track.style.y ?? 0) / positionReferenceHeight) * 100}%)`,
      zIndex: track.zIndex,
    } as CSSProperties,
    currentStyle: { opacity: timing.primaryOpacity },
    nextPhraseStyle: {
      opacity: timing.secondaryOpacity,
      top: `${timing.secondaryOffset * 50}%`,
      transform: `translate(-50%, calc(${(timing.secondaryOffset - 1) * 50}% + ${timing.secondaryOffset * 0.75}rem)) scale(${timing.secondaryScale})`,
    } as CSSProperties,
    entryCueStyle: {
      "--entry-cue-progress": entryCueProgress ?? 0,
      "--entry-cue-empty-color": entryCueColors.unreadColor,
      "--entry-cue-fill-color": entryCueColors.readColor,
      "--entry-cue-scale": entryCueColors.scale,
    } as CSSProperties,
    showEntryCue: entryCueProgress !== null && !timing.suppressEntryCue,
  };
}

function subtitleColorSource(
  property: "unreadColor" | "readColor",
  trackStyle: SubtitleStyle,
  phraseStyle?: SubtitleStyle,
  wordStyle?: SubtitleStyle
): "track" | "phrase" | "word" | "default" {
  if (wordStyle?.[property] !== undefined) return "word";
  if (phraseStyle?.[property] !== undefined) return "phrase";
  if (trackStyle[property] !== undefined) return "track";
  return "default";
}

const backgroundMimeType = (asset: string) => {
  const extension = asset.split(".").pop()?.toLowerCase();
  if (extension === "mp4") return "video/mp4";
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";
  if (extension === "mkv") return "video/x-matroska";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
};
const isVideoBackgroundAsset = (asset: string) =>
  ["mp4", "webm", "mov", "mkv"].includes(
    asset.split(".").pop()?.toLowerCase() ?? ""
  );

export function useBehavior(_: Record<string, never>) {
  const { projectId } = useParams({ from: "/projects/$projectId/editor" });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { timelineAutoFollow, setTimelineAutoFollow } = useTimelineAutoFollow();
  const [data, setAppData] = useAppContext();
  const [editorData, setEditorData] = useEditorData();
  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState<string | null>(
    null
  );
  const [backgroundMediaReady, setBackgroundMediaReady] = useState(false);
  const [timelineDropTargetTrackId, setTimelineDropTargetTrackId] = useState<
    string | null
  >(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportResolution, setExportResolution] = useState<
    "480p" | "720p" | "1080p" | "1440p"
  >("1080p");
  const [exportFps, setExportFps] = useState<30 | 60>(60);
  const [exportAudioMode, setExportAudioMode] = useState<
    "mix" | "vocals" | "instrumental"
  >("instrumental");
  const [exportInstrumentalVolume, setExportInstrumentalVolume] = useState(1);
  const [exportVocalsVolume, setExportVocalsVolume] = useState(0);
  const [exportEncodingPreset, setExportEncodingPreset] = useState<
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
  >("veryfast");
  const [renderProgress, setRenderProgress] = useState<{
    jobId: string;
    status: ProjectRenderProgress["status"];
    progress: number;
    outputPath?: string;
    error?: string;
  } | null>(null);
  const {
    project,
    currentTime,
    isPlaying,
    isAudioReady,
    selectedTrackId,
    selectedPhraseId,
    selectedWordId,
    trackPendingDeletionId,
    inspectorTab,
    timelineZoom,
    timelineTool,
    bpmInputValue,
    trackScaleInputValue,
    phraseScaleInputValue,
    wordScaleInputValue,
    error,
    audioSources,
  } = editorData;
  const setProject = useCallback(
    (project: KaraokeProject | null) => setEditorData({ project }),
    [setEditorData]
  );
  const setCurrentTime = useCallback(
    (currentTime: number) => setEditorData({ currentTime }),
    [setEditorData]
  );
  const setIsPlaying = useCallback(
    (isPlaying: boolean) => setEditorData({ isPlaying }),
    [setEditorData]
  );
  const setIsAudioReady = useCallback(
    (isAudioReady: boolean) => setEditorData({ isAudioReady }),
    [setEditorData]
  );
  const setSelectedTrackId = useCallback(
    (selectedTrackId: string | null) => setEditorData({ selectedTrackId }),
    [setEditorData]
  );
  const setSelectedPhraseId = useCallback(
    (selectedPhraseId: string | null) => setEditorData({ selectedPhraseId }),
    [setEditorData]
  );
  const setSelectedWordId = useCallback(
    (selectedWordId: string | null) => setEditorData({ selectedWordId }),
    [setEditorData]
  );
  const setTrackPendingDeletionId = useCallback(
    (trackPendingDeletionId: string | null) =>
      setEditorData({ trackPendingDeletionId }),
    [setEditorData]
  );
  const setInspectorTab = useCallback(
    (inspectorTab: InspectorTab) => setEditorData({ inspectorTab }),
    [setEditorData]
  );
  const onSelectTrack = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setSelectedPhraseId(null);
      setSelectedWordId(null);
      setInspectorTab("properties");
    },
    [
      setInspectorTab,
      setSelectedPhraseId,
      setSelectedTrackId,
      setSelectedWordId,
    ]
  );
  const setTimelineTool = useCallback(
    (timelineTool: TimelineTool) => setEditorData({ timelineTool }),
    [setEditorData]
  );
  const setBpmInputValue = useCallback(
    (bpmInputValue: string) => setEditorData({ bpmInputValue }),
    [setEditorData]
  );
  const setTrackScaleInputValue = useCallback(
    (trackScaleInputValue: string) => setEditorData({ trackScaleInputValue }),
    [setEditorData]
  );
  const setPhraseScaleInputValue = useCallback(
    (phraseScaleInputValue: string) => setEditorData({ phraseScaleInputValue }),
    [setEditorData]
  );
  const setWordScaleInputValue = useCallback(
    (wordScaleInputValue: string) => setEditorData({ wordScaleInputValue }),
    [setEditorData]
  );
  const setError = useCallback(
    (error: string | null) => setEditorData({ error }),
    [setEditorData]
  );
  const setAudioSources = useCallback(
    (audioSources: EditorData["audioSources"]) =>
      setEditorData({ audioSources }),
    [setEditorData]
  );
  const projectRef = useRef<KaraokeProject | null>(null);
  const currentTimeRef = useRef(0);
  const selectionRef = useRef({
    selectedTrackId,
    selectedPhraseId,
    selectedWordId,
  });
  selectionRef.current = {
    selectedTrackId,
    selectedPhraseId,
    selectedWordId,
  };
  const instrumentalAudio = useRef<HTMLAudioElement>(null);
  const vocalsAudio = useRef<HTMLAudioElement>(null);
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const backgroundImage = useRef<HTMLImageElement>(null);
  const previewCanvas = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLabelsRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const timelinePlayheadRef = useRef<HTMLDivElement>(null);
  const timelineZoomRef = useRef(timelineZoom);
  const timelineZoomingUntilRef = useRef(0);
  const hoveredPhraseRef = useRef<{
    trackId: string;
    phraseId: string;
    clientX: number;
  } | null>(null);
  const lastVocalsHardSyncRef = useRef(Number.NEGATIVE_INFINITY);
  const saveTimerRef = useRef<number | null>(null);
  const closingWindowRef = useRef(false);
  const phraseClipboardRef = useRef<SubtitlePhrase | null>(null);
  const historyRef = useRef<EditorHistoryEntry[]>([]);
  const thumbnailCaptureKeyRef = useRef<string | null>(null);
  const thumbnailCaptureRef = useRef<(() => Promise<void>) | null>(null);
  const liveColorElementsRef = useRef<HTMLElement[]>([]);
  const exportLockRef = useRef(false);
  const renderJobIdRef = useRef<string | null>(null);
  const [isCancellingExport, setIsCancellingExport] = useState(false);

  const setLiveProject = useCallback(
    (next: KaraokeProject) => {
      if (exportLockRef.current) return projectRef.current ?? next;
      const normalizedProject = normalizeSubtitlePhraseOrder(next);
      const thumbnail = isDesktop()
        ? normalizedProject.thumbnail
        : createProjectThumbnail(normalizedProject);
      const normalized =
        normalizedProject.thumbnail === thumbnail
          ? normalizedProject
          : { ...normalizedProject, thumbnail };
      projectRef.current = normalized;
      setProject(normalized);
      return normalized;
    },
    [setProject]
  );
  const saveProjectNow = useCallback(
    (next: KaraokeProject) => {
      void saveProject(next, data.preferences.storageDirectory).catch(
        (reason) => setError(String(reason))
      );
    },
    [data.preferences.storageDirectory]
  );
  const applyProject = useCallback(
    (next: KaraokeProject, immediate = false) => {
      if (exportLockRef.current) return;
      const normalized = setLiveProject(
        isDesktop() ? { ...next, thumbnail: null } : next
      );
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (immediate) {
        saveProjectNow(normalized);
        return;
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        saveProjectNow(normalized);
      }, 250);
    },
    [saveProjectNow, setLiveProject]
  );
  const persistProject = useCallback(
    (
      next: KaraokeProject,
      immediate = false,
      historySource = projectRef.current
    ) => {
      if (exportLockRef.current) return;
      if (historySource && historySource !== next) {
        const selection = selectionRef.current;
        historyRef.current.push({
          project: historySource,
          selectedTrackId: selection.selectedTrackId,
          selectedPhraseId: selection.selectedPhraseId,
          selectedWordId: selection.selectedWordId,
        });
        if (historyRef.current.length > HISTORY_LIMIT) {
          historyRef.current.splice(
            0,
            historyRef.current.length - HISTORY_LIMIT
          );
        }
      }
      applyProject(next, immediate);
    },
    [applyProject]
  );
  const onRenameTrack = useCallback(
    (trackId: string, name: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const track = currentProject.tracks.find((item) => item.id === trackId);
      if (!track || track.name === name) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((item) =>
          item.id === trackId ? { ...item, name } : item
        ),
      });
    },
    [persistProject]
  );
  const refresh = useCallback(async () => {
    try {
      const loaded = await loadProject(
        projectId,
        data.preferences.storageDirectory
      );
      if (loaded) {
        const normalized = setLiveProject(loaded);
        if (
          normalized.thumbnail !== loaded.thumbnail ||
          JSON.stringify(normalized.tracks) !== JSON.stringify(loaded.tracks)
        )
          saveProjectNow(normalized);
        setAppData({ currentProject: { id: loaded.id, name: loaded.name } });
      }
    } catch (reason) {
      setError(String(reason));
    }
  }, [
    data.preferences.storageDirectory,
    projectId,
    setAppData,
    setLiveProject,
  ]);

  useEffect(() => {
    historyRef.current = [];
    phraseClipboardRef.current = null;
  }, [projectId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (
      data.requestedEditorAction?.projectId !== projectId ||
      data.requestedEditorAction.action !== "export" ||
      !project
    )
      return;
    setExportDialogOpen(true);
    setAppData({ requestedEditorAction: null });
  }, [data.requestedEditorAction, project, projectId, setAppData]);
  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (projectRef.current && !exportLockRef.current)
        saveProjectNow(projectRef.current);
    },
    [saveProjectNow]
  );
  const saveBeforeWindowClose = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await thumbnailCaptureRef.current?.();
    if (!projectRef.current) return;
    try {
      await saveProject(projectRef.current, data.preferences.storageDirectory);
    } catch (reason) {
      setError(String(reason));
      throw reason;
    }
  }, [data.preferences.storageDirectory]);
  useEffect(
    () => registerBeforeWindowClose(saveBeforeWindowClose),
    [saveBeforeWindowClose]
  );
  const onMinimizeWindow = useCallback(() => {
    void windowAction("minimize");
  }, []);
  const onToggleMaximizeWindow = useCallback(() => {
    void windowAction("maximize");
  }, []);
  const onCloseWindow = useCallback(async () => {
    if (closingWindowRef.current) return;
    closingWindowRef.current = true;
    try {
      await saveBeforeWindowClose();
      await windowAction("close");
    } finally {
      closingWindowRef.current = false;
    }
  }, [saveBeforeWindowClose]);
  useEffect(() => {
    let disposed = false;
    const objectUrls: string[] = [];
    setIsAudioReady(false);
    setAudioSources(null);
    void projectAudioSources(projectId, data.preferences.storageDirectory)
      .then(async (sources) => {
        const createAudioUrl = async (sourceId: string | null) => {
          if (!sourceId) return null;
          const bytes = await readProjectAudio(sourceId);
          const url = URL.createObjectURL(
            new Blob([bytes], { type: "audio/mpeg" })
          );
          if (disposed) {
            URL.revokeObjectURL(url);
            return null;
          }
          objectUrls.push(url);
          return url;
        };
        const [instrumental, vocals] = await Promise.all([
          createAudioUrl(sources.instrumental),
          createAudioUrl(sources.vocals),
        ]);
        if (!disposed) setAudioSources({ instrumental, vocals });
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason));
      });
    return () => {
      disposed = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.preferences.storageDirectory, projectId]);
  useEffect(() => {
    if (
      !project?.processing.some(
        (stage) => stage.status === "pending" || stage.status === "running"
      )
    )
      return;
    let disposed = false;
    void (async () => {
      await saveProjectBeforeWindowClose();
      if (disposed) return;
      await navigate({
        to: "/projects/$projectId/preparing",
        params: { projectId },
      });
    })();
    return () => {
      disposed = true;
    };
  }, [navigate, project, projectId]);
  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;
    void listenDesktop<{ projectId: string }>(
      "project-processing-progress",
      (event) => {
        if (event.payload.projectId === projectId) void refresh();
      }
    ).then((stop) => {
      unlisten = stop;
    });
    return () => unlisten?.();
  }, [projectId, refresh]);
  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;
    void listenDesktop<ProjectRenderProgress>(
      "project-render-progress",
      (event) => {
        if (event.payload.jobId !== renderJobIdRef.current) return;
        if (event.payload.status !== "rendering") {
          exportLockRef.current = false;
          renderJobIdRef.current = null;
          setIsCancellingExport(false);
        }
        setRenderProgress((current) =>
          current?.jobId === event.payload.jobId
            ? {
                ...current,
                status: event.payload.status,
                progress: event.payload.progress ?? current.progress,
                outputPath: event.payload.outputPath ?? current.outputPath,
                error: event.payload.error ?? current.error,
              }
            : current
        );
      }
    ).then((stop) => {
      unlisten = stop;
    });
    return () => unlisten?.();
  }, []);

  const subtitleTracks = useMemo(
    () => project?.tracks.filter(isSubtitleTrack) ?? [],
    [project]
  );
  const firstPhraseStart = useMemo(
    () =>
      [...subtitleTracks]
        .flatMap((track) => track.phrases)
        .reduce<number | null>(
          (earliest, phrase) =>
            earliest === null || phrase.start < earliest
              ? phrase.start
              : earliest,
          null
        ),
    [subtitleTracks]
  );
  const selectedProjectTrack = useMemo(
    () => project?.tracks.find((track) => track.id === selectedTrackId) ?? null,
    [project, selectedTrackId]
  );
  const subtitleTrack = isSubtitleTrack(selectedProjectTrack)
    ? selectedProjectTrack
    : null;
  const backgroundTrack = isBackgroundTrack(selectedProjectTrack)
    ? selectedProjectTrack
    : null;
  const projectBackgroundTrack = useMemo(
    () => project?.tracks.find(isBackgroundTrack) ?? null,
    [project]
  );
  useEffect(() => {
    if (!project) return;
    if (project.tracks.some((track) => track.id === selectedTrackId)) return;
    setSelectedTrackId(
      project.tracks.find(isSubtitleTrack)?.id ?? project.tracks[0]?.id ?? null
    );
  }, [project, selectedTrackId]);
  const audioTrack = useMemo(
    () => project?.tracks.find(isAudioTrack) ?? null,
    [project]
  );
  const timelineDuration = Math.max(
    project?.duration ?? 0,
    subtitleTracks.reduce(
      (trackMaximum, track) =>
        Math.max(
          trackMaximum,
          track.phrases.reduce(
            (phraseMaximum, phrase) => Math.max(phraseMaximum, phrase.end),
            0
          )
        ),
      0
    ),
    1
  );
  const instrumentalSource = audioSources?.instrumental ?? undefined;
  const vocalsSource = audioSources?.vocals ?? undefined;
  const instrumentalVolume = clamp(
    Math.round((audioTrack?.volume ?? 1) * 100),
    0,
    100
  );
  const vocalsVolume = clamp(
    Math.round((audioTrack?.vocalsVolume ?? 0) * 100),
    0,
    100
  );
  const backgroundPreset = projectBackgroundTrack?.preset ?? "solid";
  const legacyBackgroundAsset = projectBackgroundTrack?.asset ?? null;
  const backgroundAsset =
    backgroundPreset === "video"
      ? (projectBackgroundTrack?.videoAsset ??
        (legacyBackgroundAsset && isVideoBackgroundAsset(legacyBackgroundAsset)
          ? legacyBackgroundAsset
          : null))
      : backgroundPreset === "image"
        ? (projectBackgroundTrack?.imageAsset ??
          (legacyBackgroundAsset &&
          !isVideoBackgroundAsset(legacyBackgroundAsset)
            ? legacyBackgroundAsset
            : null))
        : backgroundPreset === "album-art"
          ? legacyBackgroundAsset
          : null;
  const backgroundAssetName =
    backgroundPreset === "video"
      ? (projectBackgroundTrack?.videoAssetName ??
        (backgroundAsset === legacyBackgroundAsset
          ? projectBackgroundTrack?.assetName
          : undefined) ??
        backgroundAsset)
      : backgroundPreset === "image"
        ? (projectBackgroundTrack?.imageAssetName ??
          (backgroundAsset === legacyBackgroundAsset
            ? projectBackgroundTrack?.assetName
            : undefined) ??
          backgroundAsset)
        : null;
  const backgroundFit = projectBackgroundTrack?.fit ?? "cover";
  const backgroundStyle = {
    background:
      backgroundPreset === "gradient"
        ? `linear-gradient(${projectBackgroundTrack?.gradientAngle ?? 135}deg, ${projectBackgroundTrack?.gradientStart ?? "#273660"}, ${projectBackgroundTrack?.gradientEnd ?? "#0b1732"})`
        : (projectBackgroundTrack?.color ?? "#0b1732"),
    "--background-fit": backgroundFit,
  } as CSSProperties;
  useEffect(() => {
    if (
      !backgroundAsset ||
      !["album-art", "image", "video"].includes(backgroundPreset)
    ) {
      setBackgroundAssetUrl(null);
      setBackgroundMediaReady(false);
      return;
    }
    let disposed = false;
    let url: string | null = null;
    setBackgroundMediaReady(false);
    void readProjectAsset(
      projectId,
      backgroundAsset,
      data.preferences.storageDirectory
    )
      .then((bytes) => {
        if (disposed) return;
        url = URL.createObjectURL(
          new Blob([bytes], { type: backgroundMimeType(backgroundAsset) })
        );
        setBackgroundAssetUrl(url);
      })
      .catch((reason) => setError(String(reason)));
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [
    backgroundAsset,
    backgroundAssetName,
    backgroundPreset,
    data.preferences.storageDirectory,
    projectId,
  ]);
  useEffect(() => {
    if (
      !isDesktop() ||
      !project ||
      firstPhraseStart === null ||
      (["album-art", "image", "video"].includes(backgroundPreset) &&
        !backgroundMediaReady)
    ) {
      thumbnailCaptureRef.current = null;
      return;
    }
    const captureKey = [
      project.id,
      project.updatedAt,
      firstPhraseStart,
      backgroundAssetUrl,
    ].join(":");
    if (thumbnailCaptureKeyRef.current === captureKey) return;
    let disposed = false;
    const capture = async (allowAfterDispose = false) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (!context) return;

      if (backgroundPreset === "gradient") {
        const gradient = context.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(
          0,
          projectBackgroundTrack?.gradientStart ?? "#273660"
        );
        gradient.addColorStop(
          1,
          projectBackgroundTrack?.gradientEnd ?? "#0b1732"
        );
        context.fillStyle = gradient;
      } else {
        context.fillStyle = projectBackgroundTrack?.color ?? "#0b1732";
      }
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (backgroundPreset === "video" && backgroundVideo.current) {
        const video = backgroundVideo.current;
        const previousTime = video.currentTime;
        const duration = video.duration;
        const targetTime =
          Number.isFinite(duration) && duration > 0
            ? (firstPhraseStart / 1000) % duration
            : firstPhraseStart / 1000;
        await waitForVideoSeek(video, targetTime);
        if (disposed && !allowAfterDispose) return;
        drawMediaBackground(context, video, backgroundFit);
        void waitForVideoSeek(video, previousTime);
      }
      if (
        ["album-art", "image"].includes(backgroundPreset) &&
        backgroundImage.current
      ) {
        drawMediaBackground(context, backgroundImage.current, backgroundFit);
      }

      subtitleTracks
        .sort((left, right) => left.zIndex - right.zIndex)
        .forEach((track) => {
          const preview = subtitlePreviewView(track, firstPhraseStart);
          const phrase = preview.playingPhrase;
          if (!preview.visible || !phrase) return;
          const style = resolveSubtitleStyle(track.style, phrase.style);
          const x =
            canvas.width / 2 +
            (style.x / style.positionReferenceWidth) * canvas.width;
          const y =
            canvas.height * 0.5 +
            (style.y / style.positionReferenceHeight) * canvas.height;
          context.save();
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.font = `${style.fontStyle} ${style.fontWeight} ${Math.round(canvas.width * 0.03 * style.scale)}px ${subtitleFontStack(style.fontFamily)}`;
          context.lineJoin = "round";
          context.lineWidth = Math.max(2, canvas.width * 0.003);
          context.strokeStyle = "#000000";
          context.shadowColor = "#000000";
          context.shadowBlur = canvas.width * 0.01;
          context.strokeText(phrase.text, x, y);
          context.fillStyle = style.unreadColor;
          context.fillText(phrase.text, x, y);
          context.restore();
        });

      const thumbnail = await jpegBlob(canvas);
      if (!thumbnail || (disposed && !allowAfterDispose)) return;
      await saveProjectThumbnail(
        project.id,
        thumbnail,
        data.preferences.storageDirectory
      );
      thumbnailCaptureKeyRef.current = captureKey;
      const latestProject = projectRef.current;
      if (latestProject?.id === project.id) {
        const withThumbnail = { ...latestProject, thumbnail: "preview.jpg" };
        projectRef.current = withThumbnail;
      }
    };
    thumbnailCaptureRef.current = async () => {
      try {
        await capture(true);
      } catch (reason) {
        if (!disposed) setError(String(reason));
      }
    };
    return () => {
      disposed = true;
    };
  }, [
    backgroundAssetUrl,
    backgroundFit,
    backgroundMediaReady,
    backgroundPreset,
    data.preferences.storageDirectory,
    firstPhraseStart,
    project,
    projectBackgroundTrack,
    setError,
    subtitleTracks,
  ]);
  useLayoutEffect(
    () => () => {
      void thumbnailCaptureRef.current?.();
    },
    []
  );
  const animationTemplate: SubtitleAnimationTemplate =
    subtitleTrack?.animation?.template ?? "template-1";
  const tempoBpm = clamp(
    project?.tempo?.bpm ?? DEFAULT_BPM,
    MINIMUM_BPM,
    MAXIMUM_BPM
  );
  const tempoOffset = clamp(project?.tempo?.offset ?? 0, 0, timelineDuration);
  const beatDuration = 60_000 / tempoBpm;
  const timelineGridStyle = {
    "--timeline-beat-size": `${(beatDuration / timelineDuration) * 100}%`,
    "--timeline-bar-size": `${((beatDuration * 4) / timelineDuration) * 100}%`,
    "--timeline-grid-offset": `${(tempoOffset / timelineDuration) * 100}%`,
  } as CSSProperties;
  useEffect(() => setBpmInputValue(String(tempoBpm)), [tempoBpm]);

  const syncBackgroundVideoTime = useCallback((seconds: number) => {
    const video = backgroundVideo.current;
    if (!video) return;
    const duration = video.duration;
    const videoTime =
      Number.isFinite(duration) && duration > 0 ? seconds % duration : seconds;

    if (Math.abs(video.currentTime - videoTime) < 0.12) return;
    try {
      video.currentTime = videoTime;
      video.playbackRate = 1;
    } catch {
      // Metadata may still be loading; onLoadedMetadata will apply the position.
    }
  }, []);
  const updateMediaTime = useCallback(
    (milliseconds: number) => {
      const seconds = milliseconds / 1000;
      [instrumentalAudio.current, vocalsAudio.current].forEach((audio) => {
        if (!audio) return;
        try {
          audio.currentTime = seconds;
          audio.playbackRate = 1;
        } catch {
          // Metadata may still be loading; the next seek will apply the position.
        }
      });
      syncBackgroundVideoTime(seconds);
    },
    [syncBackgroundVideoTime]
  );
  const followTimelineAt = useCallback(
    (milliseconds: number) => {
      if (!timelineAutoFollow) return;
      if (performance.now() < timelineZoomingUntilRef.current) return;
      const viewport = timelineRef.current;
      const content = timelineContentRef.current;
      if (!viewport || !content) return;
      const contentWidth = content.getBoundingClientRect().width;
      viewport.scrollLeft = timelineFollowScrollLeft(
        milliseconds,
        timelineDuration,
        content.offsetLeft,
        contentWidth,
        viewport.clientWidth,
        viewport.scrollWidth
      );
    },
    [timelineAutoFollow, timelineDuration]
  );
  const updateTimelinePlayhead = useCallback(
    (milliseconds: number) => {
      const playhead = timelinePlayheadRef.current;
      if (!playhead) return;
      const percent = clamp(
        (milliseconds / Math.max(1, timelineDuration)) * 100,
        0,
        100
      );
      playhead.style.left = `${percent}%`;
    },
    [timelineDuration]
  );
  useEffect(() => {
    if (timelineAutoFollow) followTimelineAt(currentTimeRef.current);
  }, [followTimelineAt, timelineAutoFollow]);
  useEffect(() => {
    if (instrumentalAudio.current)
      instrumentalAudio.current.volume = instrumentalVolume / 100;
    if (vocalsAudio.current) vocalsAudio.current.volume = vocalsVolume / 100;
  }, [instrumentalVolume, vocalsVolume]);
  useEffect(
    () => () => {
      instrumentalAudio.current?.pause();
      vocalsAudio.current?.pause();
      backgroundVideo.current?.pause();
    },
    []
  );

  const subtitlePreviews = useMemo(
    () =>
      subtitleTracks.map((track) => subtitlePreviewView(track, currentTime)),
    [currentTime, subtitleTracks]
  );
  const selectedSubtitlePreview =
    subtitlePreviews.find((preview) => preview.id === subtitleTrack?.id) ??
    null;
  const playingPhrase = selectedSubtitlePreview?.playingPhrase ?? null;
  const selectedPhrase =
    subtitleTrack?.phrases.find((phrase) => phrase.id === selectedPhraseId) ??
    null;
  const activePhrase = selectedPhrase ?? playingPhrase;
  const playbackWord =
    playingPhrase?.words.find(
      (word) => currentTime >= word.start && currentTime <= word.end
    ) ?? null;
  const playbackWordId = playbackWord?.id ?? null;
  const playingPhraseId = playingPhrase?.id ?? null;
  const selectedWord =
    activePhrase?.words.find((word) => word.id === selectedWordId) ?? null;

  useEffect(() => {
    if (playingPhraseId === null) {
      setSelectedWordId(null);
      return;
    }

    setSelectedPhraseId(playingPhraseId);
    setSelectedWordId(playbackWordId);
  }, [playbackWordId, playingPhraseId]);

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

  const onUpdatePhraseText = useCallback(
    (text: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = {
        ...activePhrase,
        text,
        words: wordsForText(activePhrase, text),
      };
      setSelectedWordId(phrase.words[0]?.id ?? null);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack]
  );
  const clearColorPreview = useCallback(() => {
    liveColorElementsRef.current.forEach((element) => {
      element.style.removeProperty("color");
    });
    liveColorElementsRef.current = [];
  }, []);
  const onPreviewScopedColor = useCallback(
    (
      scope: SubtitlePropertyScope,
      property: "unreadColor" | "readColor",
      value: string
    ) => {
      if (!subtitleTrack) return;
      if (scope !== "track" && !activePhrase) return;
      if (scope === "word" && !selectedWord) return;

      clearColorPreview();
      const elements = previewCanvas.current?.querySelectorAll<HTMLElement>(
        "[data-subtitle-color]"
      );
      if (!elements) return;

      elements.forEach((element) => {
        if (
          element.dataset.subtitleColor !== property ||
          element.dataset.subtitleTrackId !== subtitleTrack.id
        ) {
          return;
        }
        const matchesScope =
          scope === "track"
            ? element.dataset.subtitleColorSource === "track"
            : scope === "phrase"
              ? element.dataset.subtitlePhraseId === activePhrase?.id &&
                element.dataset.subtitleColorSource === "phrase"
              : element.dataset.subtitlePhraseId === activePhrase?.id &&
                element.dataset.subtitleWordId === selectedWord?.id;
        if (!matchesScope) return;
        element.style.color = value;
        liveColorElementsRef.current.push(element);
      });
    },
    [activePhrase, clearColorPreview, selectedWord, subtitleTrack]
  );
  const updateScopedStyle = useCallback(
    (
      scope: SubtitlePropertyScope,
      property: keyof Pick<
        SubtitleStyle,
        | "unreadColor"
        | "readColor"
        | "x"
        | "y"
        | "fontFamily"
        | "fontWeight"
        | "fontStyle"
        | "textDecoration"
        | "verticalAlign"
      >,
      value: NonNullable<SubtitleStyle[typeof property]>
    ) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      if (scope === "track") {
        const bounds = previewCanvas.current?.getBoundingClientRect();
        const positionReference =
          property === "x" || property === "y"
            ? {
                positionReferenceWidth: Math.round(bounds?.width ?? 640),
                positionReferenceHeight: Math.round(bounds?.height ?? 360),
              }
            : {};
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? {
                  ...track,
                  style: {
                    ...track.style,
                    ...positionReference,
                    [property]: value,
                  },
                }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: { ...activePhrase.style, [property]: value },
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? { ...word, style: { ...word.style, [property]: value } }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );
  const resetScopedColor = useCallback(
    (
      scope: Exclude<SubtitlePropertyScope, "track">,
      property: keyof SubtitleStyle | "typography"
    ) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: withoutStyleProperty(activePhrase.style, property),
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? {
                  ...word,
                  style: withoutStyleProperty(word.style, property),
                }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );
  const updateScale = useCallback(
    (scope: SubtitlePropertyScope, scale: number | undefined) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      if (scope === "track") {
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? {
                  ...track,
                  style: { ...track.style, scale: scale ?? 1 },
                }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        persistProject(
          replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
            ...activePhrase,
            style: optionalStyleScale(activePhrase.style, scale),
          })
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) =>
            word.id === selectedWord.id
              ? { ...word, style: optionalStyleScale(word.style, scale) }
              : word
          ),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );
  const commitScaleInput = useCallback(
    (
      scope: SubtitlePropertyScope,
      input: string,
      fallback: string,
      setInput: (value: string) => void
    ) => {
      if (input.trim() === "" && scope !== "track") {
        setInput("");
        updateScale(scope, undefined);
        return;
      }
      const parsed = Number(input);
      if (!Number.isFinite(parsed) || input.trim() === "") {
        setInput(fallback);
        return;
      }
      const normalized = Math.round(
        clamp(parsed, MINIMUM_SCALE_PERCENTAGE, MAXIMUM_SCALE_PERCENTAGE)
      );
      setInput(String(normalized));
      updateScale(scope, normalized / 100);
    },
    [updateScale]
  );
  const updateReadCurve = useCallback(
    (scope: SubtitlePropertyScope, value: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      const curve = value === "inherit" ? undefined : value;
      if (scope === "track") {
        persistProject({
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? { ...track, curve: curve ?? "linear" }
              : track
          ),
        });
        return;
      }
      if (!activePhrase) return;
      if (scope === "phrase") {
        const phrase = { ...activePhrase };
        if (curve === undefined) delete phrase.curve;
        else phrase.curve = curve;
        persistProject(
          replacePhrase(
            currentProject,
            subtitleTrack.id,
            activePhrase.id,
            phrase
          )
        );
        return;
      }
      if (!selectedWord) return;
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, {
          ...activePhrase,
          words: activePhrase.words.map((word) => {
            if (word.id !== selectedWord.id) return word;
            const nextWord = { ...word };
            if (curve === undefined) delete nextWord.curve;
            else nextWord.curve = curve;
            return nextWord;
          }),
        })
      );
    },
    [activePhrase, persistProject, selectedWord, subtitleTrack]
  );
  const onUpdateTrackPosition = useCallback(
    (property: "x" | "y", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type === "subtitle" && track.id === subtitleTrack.id
            ? { ...track, style: { ...track.style, [property]: value } }
            : track
        ),
      });
    },
    [persistProject, subtitleTrack]
  );
  const updatePhraseTime = useCallback(
    (edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase =
        edge === "start"
          ? resizePhraseStart(activePhrase, value)
          : resizePhraseEnd(activePhrase, value, timelineDuration);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );
  const updateWordTime = useCallback(
    (edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase || !selectedWord)
        return;
      const phrase = resizeWordBoundary(
        activePhrase,
        selectedWord.id,
        edge,
        value,
        timelineDuration
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [
      activePhrase,
      persistProject,
      selectedWord,
      subtitleTrack,
      timelineDuration,
    ]
  );
  const updateInspectorWordTime = useCallback(
    (wordId: string, edge: "start" | "end", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = resizeWordBoundary(
        activePhrase,
        wordId,
        edge,
        value,
        timelineDuration
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );
  const onUpdateInspectorWordText = useCallback(
    (wordId: string, text: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = replacePhraseWordText(activePhrase, wordId, text);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack]
  );
  const onInsertInspectorGap = useCallback(
    (wordId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = insertGapAfterWord(activePhrase, wordId, timelineDuration);
      if (phrase === activePhrase) return;
      const previousIds = new Set(activePhrase.words.map((word) => word.id));
      const gap = phrase.words.find(
        (word) => word.type === "gap" && !previousIds.has(word.id)
      );
      setSelectedWordId(gap?.id ?? null);
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, subtitleTrack, timelineDuration]
  );
  const onDeleteInspectorWord = useCallback(
    (wordId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack || !activePhrase) return;
      const phrase = removePhraseWord(activePhrase, wordId);
      const nextSelectedWord = phrase.words.find((word) => word.type !== "gap");
      setSelectedWordId(
        selectedWordId === wordId
          ? (nextSelectedWord?.id ?? null)
          : selectedWordId
      );
      persistProject(
        replacePhrase(currentProject, subtitleTrack.id, activePhrase.id, phrase)
      );
    },
    [activePhrase, persistProject, selectedWordId, subtitleTrack]
  );
  const onAddSubtitleTrack = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject) return;
    const track: SubtitleTrack = {
      id: `subtitles-${Date.now()}-${crypto.randomUUID()}`,
      type: "subtitle",
      name: t("editor.newSubtitleTrack", {
        number: String(subtitleTracks.length + 1),
      }),
      visible: true,
      locked: false,
      zIndex:
        Math.max(20, ...currentProject.tracks.map((item) => item.zIndex)) + 1,
      style: {
        unreadColor: "#FFFFFF",
        readColor: "#FF0044",
        scale: 1,
        x: 0,
        y: 30 + subtitleTracks.length * 72,
      },
      curve: "linear",
      animation: { template: "template-1" },
      phrases: [],
    };
    setSelectedTrackId(track.id);
    setSelectedPhraseId(null);
    setSelectedWordId(null);
    setInspectorTab("properties");
    persistProject(
      {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: [...currentProject.tracks, track],
      },
      true
    );
  }, [persistProject, subtitleTracks.length, t]);
  const updateAudioMix = useCallback(
    (property: "volume" | "vocalsVolume", percentage: number) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type === "audio"
            ? { ...track, [property]: clamp(percentage, 0, 100) / 100 }
            : track
        ),
      });
    },
    [persistProject]
  );
  const onOpenExport = useCallback(() => {
    if (exportLockRef.current) return;
    const audio = projectRef.current?.tracks.find(isAudioTrack);
    const instrumental = audio?.volume ?? 1;
    const vocals = audio?.vocalsVolume ?? 0;
    setExportInstrumentalVolume(instrumental);
    setExportVocalsVolume(vocals);
    setExportAudioMode("instrumental");
    setExportDialogOpen(true);
  }, []);
  const onStartExport = useCallback(async () => {
    const currentProject = projectRef.current;
    if (!currentProject || !isDesktop()) return;
    const selectedOutputPath = await chooseVideoDestination(
      `${currentProject.name}.mp4`
    );
    if (!selectedOutputPath) return;
    const outputPath = selectedOutputPath.toLowerCase().endsWith(".mp4")
      ? selectedOutputPath
      : `${selectedOutputPath}.mp4`;
    const resolution = {
      "480p": [854, 480],
      "720p": [1280, 720],
      "1080p": [1920, 1080],
      "1440p": [2560, 1440],
    } as const;
    const [width, height] = resolution[exportResolution];
    const instrumentalVolume =
      exportAudioMode === "vocals" ? 0 : exportInstrumentalVolume;
    const vocalsVolume =
      exportAudioMode === "instrumental" ? 0 : exportVocalsVolume;
    try {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      await saveProject(currentProject, data.preferences.storageDirectory);
      const jobId = await startProjectRender({
        projectId,
        storageDirectory: data.preferences.storageDirectory,
        outputPath,
        width,
        height,
        fps: exportFps,
        instrumentalVolume,
        vocalsVolume,
        encodingPreset: exportEncodingPreset,
      });
      exportLockRef.current = true;
      renderJobIdRef.current = jobId;
      setExportDialogOpen(false);
      setRenderProgress({ jobId, status: "rendering", progress: 0 });
    } catch (reason) {
      setError(String(reason));
    }
  }, [
    data.preferences.storageDirectory,
    exportAudioMode,
    exportFps,
    exportInstrumentalVolume,
    exportResolution,
    exportVocalsVolume,
    exportEncodingPreset,
    projectId,
  ]);
  const onCancelExport = useCallback(async () => {
    if (!renderProgress) return;
    if (renderProgress.status !== "rendering") {
      exportLockRef.current = false;
      renderJobIdRef.current = null;
      setRenderProgress(null);
      return;
    }
    if (isCancellingExport) return;

    setIsCancellingExport(true);
    try {
      await cancelProjectRender(renderProgress.jobId);
      exportLockRef.current = false;
      renderJobIdRef.current = null;
      setRenderProgress(null);
    } catch (reason) {
      setError(String(reason));
      setRenderProgress((current) =>
        current?.jobId === renderProgress.jobId
          ? { ...current, error: String(reason) }
          : current
      );
    } finally {
      setIsCancellingExport(false);
    }
  }, [isCancellingExport, renderProgress, setError]);
  const updateBackground = useCallback(
    (patch: Partial<BackgroundTrack>) => {
      const currentProject = projectRef.current;
      if (!currentProject || !backgroundTrack) return;
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.id === backgroundTrack.id ? { ...track, ...patch } : track
        ),
      });
    },
    [backgroundTrack, persistProject]
  );
  const onBackgroundPresetChange = useCallback(
    async (preset: BackgroundPreset) => {
      if (!backgroundTrack) return;
      if (preset === "album-art") {
        try {
          const asset = await extractAlbumArt(
            projectId,
            data.preferences.storageDirectory
          );
          updateBackground({ preset, asset, fit: "cover" });
        } catch (reason) {
          setError(String(reason));
        }
        return;
      }
      updateBackground({ preset });
    },
    [
      backgroundTrack,
      data.preferences.storageDirectory,
      projectId,
      updateBackground,
    ]
  );
  const onBackgroundAssetImport = useCallback(
    async (kind: "image" | "video") => {
      if (!backgroundTrack) return;
      try {
        const sourcePath = await chooseBackgroundFile(kind);
        if (!sourcePath) return;
        const asset = await importBackgroundAsset(
          projectId,
          sourcePath,
          kind,
          data.preferences.storageDirectory
        );
        updateBackground({
          preset: kind,
          ...(kind === "video"
            ? {
                videoAsset: asset,
                videoAssetName: sourcePath.split(/[\\/]/).pop() ?? asset,
              }
            : {
                imageAsset: asset,
                imageAssetName: sourcePath.split(/[\\/]/).pop() ?? asset,
              }),
          fit: "cover",
        });
      } catch (reason) {
        setError(String(reason));
      }
    },
    [
      backgroundTrack,
      data.preferences.storageDirectory,
      projectId,
      updateBackground,
    ]
  );
  const updateTempo = useCallback(
    (property: "bpm" | "offset", value: number) => {
      const currentProject = projectRef.current;
      if (!currentProject || !Number.isFinite(value)) return;
      const currentTempo = currentProject.tempo ?? {
        bpm: DEFAULT_BPM,
        offset: 0,
      };
      const nextValue =
        property === "bpm"
          ? Math.round(clamp(value, MINIMUM_BPM, MAXIMUM_BPM) * 100) / 100
          : Math.round(clamp(value, 0, timelineDuration));
      persistProject({
        ...currentProject,
        updatedAt: String(Date.now()),
        tempo: { ...currentTempo, [property]: nextValue },
      });
    },
    [persistProject, timelineDuration]
  );
  const commitBpmInput = useCallback(() => {
    const parsed = Number(bpmInputValue);
    if (!Number.isFinite(parsed) || bpmInputValue.trim() === "") {
      setBpmInputValue(String(tempoBpm));
      return;
    }
    const normalized =
      Math.round(clamp(parsed, MINIMUM_BPM, MAXIMUM_BPM) * 100) / 100;
    setBpmInputValue(String(normalized));
    updateTempo("bpm", normalized);
  }, [bpmInputValue, tempoBpm, updateTempo]);
  const onBpmKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur();
        return;
      }
      if (event.key === "Escape") {
        setBpmInputValue(String(tempoBpm));
        event.currentTarget.blur();
      }
    },
    [tempoBpm]
  );
  const onAnimationTemplateChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const currentProject = projectRef.current;
      if (!currentProject || !subtitleTrack) return;
      const template = event.target.value as SubtitleAnimationTemplate;
      persistProject(
        {
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks: currentProject.tracks.map((track) =>
            track.type === "subtitle" && track.id === subtitleTrack.id
              ? { ...track, animation: { template } }
              : track
          ),
        },
        true
      );
    },
    [persistProject, subtitleTrack]
  );

  const onTogglePlayback = useCallback(() => {
    const instrumental = instrumentalAudio.current;
    const vocals = vocalsAudio.current;
    if (!instrumental || !instrumentalSource) {
      setError(t("editor.audioUnavailable"));
      return;
    }
    if (isPlaying) {
      instrumental.pause();
      vocals?.pause();
      backgroundVideo.current?.pause();
      setIsPlaying(false);
      return;
    }
    updateMediaTime(currentTimeRef.current);
    const instrumentalPlayback = instrumental.play();
    const vocalsPlayback =
      vocals && vocalsSource
        ? vocals.play().catch((reason) => {
            setError(
              t("editor.vocalsPlaybackError", { details: String(reason) })
            );
          })
        : Promise.resolve();
    void (async () => {
      try {
        await instrumentalPlayback;
        setIsPlaying(true);
        void backgroundVideo.current?.play().catch(() => undefined);
        await vocalsPlayback;
      } catch (reason) {
        instrumental.pause();
        vocals?.pause();
        backgroundVideo.current?.pause();
        setError(t("editor.audioPlaybackError", { details: String(reason) }));
        setIsPlaying(false);
      }
    })();
  }, [instrumentalSource, isPlaying, t, updateMediaTime, vocalsSource]);
  const onSeek = useCallback(
    (value: number) => {
      const next = clamp(value, 0, timelineDuration);
      updateMediaTime(next);
      currentTimeRef.current = next;
      updateTimelinePlayhead(next);
      setCurrentTime(next);
      followTimelineAt(next);
    },
    [
      followTimelineAt,
      timelineDuration,
      updateMediaTime,
      updateTimelinePlayhead,
    ]
  );
  const onSelectPhrase = useCallback(
    (trackId: string, phrase: SubtitlePhrase) => {
      setSelectedTrackId(trackId);
      setSelectedPhraseId(phrase.id);
      setSelectedWordId(null);
    },
    []
  );
  const onSelectWord = useCallback(
    (trackId: string, phrase: SubtitlePhrase, word: SubtitleWord) => {
      setSelectedTrackId(trackId);
      setSelectedPhraseId(phrase.id);
      setSelectedWordId(word.id);
      onSeek(word.start);
    },
    [onSeek]
  );

  const startGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      gesture: PhraseGesture,
      word?: SubtitleWord,
      wordEdge?: "start" | "end" | "move"
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceProject = projectRef.current;
      if (!sourceProject) return;
      const contentWidth =
        timelineContentRef.current?.getBoundingClientRect().width ?? 1;
      const initialX = event.clientX;
      setSelectedTrackId(track.id);
      setSelectedPhraseId(phrase.id);
      if (word) setSelectedWordId(word.id);

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = Math.round(
          ((moveEvent.clientX - initialX) / contentWidth) * timelineDuration
        );
        let nextPhrase = phrase;
        const targetTrackId =
          gesture === "move" && !word
            ? (subtitleTrackIdAtPosition(moveEvent.clientY) ?? track.id)
            : track.id;
        setTimelineDropTargetTrackId(
          targetTrackId === track.id ? null : targetTrackId
        );
        if (gesture === "move" && !word) setSelectedTrackId(targetTrackId);
        if (word && wordEdge) {
          nextPhrase =
            wordEdge === "move"
              ? moveWordWithinPhrase(phrase, word.id, delta, timelineDuration)
              : resizeWordBoundary(
                  phrase,
                  word.id,
                  wordEdge,
                  (wordEdge === "start" ? word.start : word.end) + delta,
                  timelineDuration
                );
        } else if (gesture === "move") {
          nextPhrase = movePhrase(phrase, delta, timelineDuration);
        } else if (gesture === "start") {
          nextPhrase = resizePhraseStart(phrase, phrase.start + delta);
        } else {
          nextPhrase = resizePhraseEnd(
            phrase,
            phrase.end + delta,
            timelineDuration
          );
        }
        setLiveProject(
          targetTrackId === track.id
            ? replacePhrase(sourceProject, track.id, phrase.id, nextPhrase)
            : movePhraseToSubtitleTrack(
                sourceProject,
                track.id,
                targetTrackId,
                phrase.id,
                nextPhrase
              )
        );
      };
      const onFinish = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onFinish);
        window.removeEventListener("pointercancel", onFinish);
        setTimelineDropTargetTrackId(null);
        const changedProject = projectRef.current;
        if (changedProject) persistProject(changedProject, true, sourceProject);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onFinish, { once: true });
      window.addEventListener("pointercancel", onFinish, { once: true });
    },
    [persistProject, setLiveProject, timelineDuration]
  );

  const onStartPhraseGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      gesture: PhraseGesture
    ) => startGesture(event, track, phrase, gesture),
    [startGesture]
  );

  const onStartWordGesture = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      track: SubtitleTrack,
      phrase: SubtitlePhrase,
      word: SubtitleWord,
      edge: "start" | "end" | "move"
    ) => startGesture(event, track, phrase, "move", word, edge),
    [startGesture]
  );

  const onSplitPhrase = useCallback(
    (track: SubtitleTrack, phrase: SubtitlePhrase, clientX: number) => {
      const currentProject = projectRef.current;
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      if (!currentProject || !bounds) return;
      const currentTrack = currentProject.tracks.find(
        (item): item is SubtitleTrack =>
          item.type === "subtitle" && item.id === track.id
      );
      const currentPhrase = currentTrack?.phrases.find(
        (item) => item.id === phrase.id
      );
      if (!currentTrack || !currentPhrase) return;
      const split = splitPhraseAtClosestWordBoundary(
        currentPhrase,
        timeAtTimelinePosition(
          clientX,
          bounds.left,
          bounds.width,
          timelineDuration
        )
      );
      if (!split) return;
      const [firstPhrase, secondPhrase] = split;
      const next: KaraokeProject = {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((item) =>
          item.type === "subtitle" && item.id === currentTrack.id
            ? {
                ...item,
                phrases: sortSubtitlePhrases(
                  item.phrases.flatMap((itemPhrase) =>
                    itemPhrase.id === currentPhrase.id
                      ? [firstPhrase, secondPhrase]
                      : itemPhrase
                  )
                ),
              }
            : item
        ),
      };
      setSelectedTrackId(currentTrack.id);
      setSelectedPhraseId(secondPhrase.id);
      setSelectedWordId(secondPhrase.words[0]?.id ?? null);
      onSeek(secondPhrase.start);
      persistProject(next, true);
    },
    [onSeek, persistProject, timelineDuration]
  );
  const onHoverPhrase = useCallback(
    (track: SubtitleTrack, phrase: SubtitlePhrase, clientX: number) => {
      hoveredPhraseRef.current = {
        trackId: track.id,
        phraseId: phrase.id,
        clientX,
      };
    },
    []
  );
  const onLeavePhrase = useCallback((phrase: SubtitlePhrase) => {
    if (hoveredPhraseRef.current?.phraseId === phrase.id)
      hoveredPhraseRef.current = null;
  }, []);

  const onInsertPhrase = useCallback(
    (event: MouseEvent<HTMLDivElement>, subtitleTarget: SubtitleTrack) => {
      if (event.target !== event.currentTarget) return;
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const start =
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) *
        timelineDuration;
      const phrase = createPhraseAt(
        start,
        timelineDuration,
        t("editor.newPhrase")
      );
      const next: KaraokeProject = {
        ...currentProject,
        updatedAt: String(Date.now()),
        tracks: currentProject.tracks.map((track) =>
          track.type !== "subtitle" || track.id !== subtitleTarget.id
            ? track
            : {
                ...track,
                phrases: sortSubtitlePhrases([...track.phrases, phrase]),
              }
        ),
      };
      setSelectedTrackId(subtitleTarget.id);
      setSelectedPhraseId(phrase.id);
      setSelectedWordId(phrase.words[0]?.id ?? null);
      onSeek(phrase.start);
      persistProject(next, true);
    },
    [onSeek, persistProject, t, timelineDuration]
  );

  const onDeletePhrase = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject || !subtitleTrack || !activePhrase) return;
    const currentTrack = currentProject.tracks.find(
      (track): track is SubtitleTrack =>
        track.type === "subtitle" && track.id === subtitleTrack.id
    );
    if (!currentTrack) return;

    const deletedIndex = currentTrack.phrases.findIndex(
      (phrase) => phrase.id === activePhrase.id
    );
    if (deletedIndex < 0) return;
    const phrases = currentTrack.phrases.filter(
      (phrase) => phrase.id !== activePhrase.id
    );
    const nextSelection =
      phrases[Math.min(deletedIndex, phrases.length - 1)] ?? null;
    const next: KaraokeProject = {
      ...currentProject,
      updatedAt: String(Date.now()),
      tracks: currentProject.tracks.map((track) =>
        track.type === "subtitle" && track.id === subtitleTrack.id
          ? { ...track, phrases }
          : track
      ),
    };
    setSelectedPhraseId(nextSelection?.id ?? null);
    setSelectedWordId(null);
    persistProject(next, true);
  }, [activePhrase, persistProject, subtitleTrack]);

  const deleteSubtitleTrack = useCallback(
    (trackId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const trackIndex = currentProject.tracks.findIndex(
        (track) => track.type === "subtitle" && track.id === trackId
      );
      if (trackIndex < 0) return;

      const deletedSubtitleIndex = currentProject.tracks
        .filter(isSubtitleTrack)
        .findIndex((track) => track.id === trackId);
      const tracks = currentProject.tracks.filter(
        (track) => track.id !== trackId
      );
      const remainingSubtitleTracks = tracks.filter(isSubtitleTrack);
      const nextSelectedTrack =
        remainingSubtitleTracks[
          Math.min(deletedSubtitleIndex, remainingSubtitleTracks.length - 1)
        ] ??
        tracks[Math.min(trackIndex, tracks.length - 1)] ??
        null;

      setTrackPendingDeletionId(null);
      setSelectedTrackId(nextSelectedTrack?.id ?? null);
      setSelectedPhraseId(null);
      setSelectedWordId(null);
      persistProject(
        {
          ...currentProject,
          updatedAt: String(Date.now()),
          tracks,
        },
        true
      );
    },
    [persistProject]
  );
  const onRequestDeleteTrack = useCallback(() => {
    if (!subtitleTrack) return;
    if (subtitleTrack.phrases.length > 0) {
      setTrackPendingDeletionId(subtitleTrack.id);
      return;
    }
    deleteSubtitleTrack(subtitleTrack.id);
  }, [deleteSubtitleTrack, subtitleTrack]);
  const onConfirmDeleteTrack = useCallback(() => {
    if (!trackPendingDeletionId) return;
    deleteSubtitleTrack(trackPendingDeletionId);
  }, [deleteSubtitleTrack, trackPendingDeletionId]);
  const onCancelDeleteTrack = useCallback(
    () => setTrackPendingDeletionId(null),
    []
  );

  const onCopyPhrase = useCallback(() => {
    if (!selectedPhrase) return false;
    phraseClipboardRef.current = {
      ...selectedPhrase,
      style: selectedPhrase.style ? { ...selectedPhrase.style } : undefined,
      words: selectedPhrase.words.map((word) => ({
        ...word,
        style: word.style ? { ...word.style } : undefined,
      })),
    };
    return true;
  }, [selectedPhrase]);

  const onPastePhrase = useCallback(() => {
    const currentProject = projectRef.current;
    const copiedPhrase = phraseClipboardRef.current;
    if (!currentProject || !subtitleTrack || !copiedPhrase) return false;
    const phrase = duplicatePhraseAt(
      copiedPhrase,
      currentTimeRef.current,
      timelineDuration
    );
    const next: KaraokeProject = {
      ...currentProject,
      updatedAt: String(Date.now()),
      tracks: currentProject.tracks.map((track) =>
        track.type === "subtitle" && track.id === subtitleTrack.id
          ? {
              ...track,
              phrases: sortSubtitlePhrases([...track.phrases, phrase]),
            }
          : track
      ),
    };
    setSelectedPhraseId(phrase.id);
    setSelectedWordId(phrase.words[0]?.id ?? null);
    onSeek(phrase.start);
    persistProject(next, true);
    return true;
  }, [onSeek, persistProject, subtitleTrack, timelineDuration]);

  const onUndo = useCallback(() => {
    const entry = historyRef.current.pop();
    if (!entry) return false;
    const restored = { ...entry.project, updatedAt: String(Date.now()) };
    setSelectedTrackId(entry.selectedTrackId);
    setSelectedPhraseId(entry.selectedPhraseId);
    setSelectedWordId(entry.selectedWordId);
    applyProject(restored, true);
    return true;
  }, [applyProject]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (exportLockRef.current) {
        event.preventDefault();
        return;
      }
      if (trackPendingDeletionId !== null) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      const commandKey = event.ctrlKey || event.metaKey;
      if (commandKey && !event.altKey && !event.shiftKey && !event.repeat) {
        const key = event.key.toLowerCase();
        const handled =
          (key === "c" && onCopyPhrase()) ||
          (key === "v" && onPastePhrase()) ||
          (key === "z" && onUndo());
        if (handled) {
          event.preventDefault();
          return;
        }
      }
      if (event.code === "Space" && !commandKey && !event.altKey) {
        event.preventDefault();
        if (!event.repeat) onTogglePlayback();
        return;
      }
      if (
        event.key.toLowerCase() === "s" &&
        !commandKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.repeat
      ) {
        const hoveredPhrase = hoveredPhraseRef.current;
        const currentProject = projectRef.current;
        const track = currentProject?.tracks.find(
          (item): item is SubtitleTrack =>
            item.type === "subtitle" && item.id === hoveredPhrase?.trackId
        );
        const phrase = track?.phrases.find(
          (item) => item.id === hoveredPhrase?.phraseId
        );
        if (track && phrase && hoveredPhrase) {
          event.preventDefault();
          onSplitPhrase(track, phrase, hoveredPhrase.clientX);
        }
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedPhraseId !== null
      ) {
        event.preventDefault();
        onDeletePhrase();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    onCopyPhrase,
    onDeletePhrase,
    onPastePhrase,
    onSplitPhrase,
    onTogglePlayback,
    onUndo,
    selectedPhraseId,
    trackPendingDeletionId,
  ]);

  const onTimelineWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const viewport = timelineRef.current;
      const content = timelineContentRef.current;
      if (!viewport || !content) return;
      const previousZoom = timelineZoomRef.current;
      const nextZoom = clamp(
        previousZoom * (event.deltaY < 0 ? 1.16 : 1 / 1.16),
        1,
        256
      );
      if (nextZoom === previousZoom) return;
      const viewportBounds = viewport.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();
      const cursorPosition = clamp(
        event.clientX - viewportBounds.left,
        0,
        viewport.clientWidth
      );
      const contentPosition = clamp(
        (event.clientX - contentBounds.left) / Math.max(1, contentBounds.width),
        0,
        1
      );
      timelineZoomRef.current = nextZoom;
      timelineZoomingUntilRef.current = performance.now() + 150;
      flushSync(() => setEditorData({ timelineZoom: nextZoom }));
      const maximumScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth
      );
      viewport.scrollLeft = clamp(
        content.offsetLeft +
          content.offsetWidth * contentPosition -
          cursorPosition,
        0,
        maximumScrollLeft
      );
    },
    [setEditorData]
  );

  useEffect(() => {
    const viewport = timelineRef.current;
    if (!viewport) return;

    viewport.addEventListener("wheel", onTimelineWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onTimelineWheel);
  }, [onTimelineWheel]);

  const onTimelineClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      if (!bounds) return;
      onSeek(
        timeAtTimelinePosition(
          event.clientX,
          bounds.left,
          bounds.width,
          timelineDuration
        )
      );
    },
    [onSeek, timelineDuration]
  );
  const onTimelineScroll = useCallback(() => {
    const viewport = timelineRef.current;
    const labels = timelineLabelsRef.current;
    if (!viewport || !labels) return;
    labels.scrollTop = viewport.scrollTop;
  }, []);

  const onInstrumentalTimeUpdate = useCallback(() => {
    const audio = instrumentalAudio.current;
    const vocals = vocalsAudio.current;
    if (!audio) return;
    if (vocals) {
      const drift = vocals.currentTime - audio.currentTime;
      const now = performance.now();

      if (
        Math.abs(drift) > VOCALS_HARD_SYNC_THRESHOLD &&
        now - lastVocalsHardSyncRef.current >= VOCALS_HARD_SYNC_INTERVAL
      ) {
        vocals.currentTime = audio.currentTime;
        vocals.playbackRate = 1;
        lastVocalsHardSyncRef.current = now;
      } else {
        vocals.playbackRate = clamp(
          1 - drift * VOCALS_SYNC_RATE_ADJUSTMENT,
          0.96,
          1.04
        );
      }
    }
    syncBackgroundVideoTime(audio.currentTime);
    const next = Math.round(audio.currentTime * 1000);
    currentTimeRef.current = next;
    updateTimelinePlayhead(next);
    setCurrentTime(next);
    followTimelineAt(next);
  }, [followTimelineAt, syncBackgroundVideoTime, updateTimelinePlayhead]);
  useEffect(() => {
    if (!isPlaying) return;
    let frameId = 0;
    const updatePlaybackClock = () => {
      onInstrumentalTimeUpdate();
      frameId = window.requestAnimationFrame(updatePlaybackClock);
    };
    frameId = window.requestAnimationFrame(updatePlaybackClock);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, onInstrumentalTimeUpdate]);
  const onPlaybackEnded = useCallback(() => {
    const audio = instrumentalAudio.current;
    if (audio) {
      const next = Math.round(audio.currentTime * 1000);
      currentTimeRef.current = next;
      updateTimelinePlayhead(next);
      setCurrentTime(next);
      followTimelineAt(next);
    }
    vocalsAudio.current?.pause();
    backgroundVideo.current?.pause();
    setIsPlaying(false);
  }, [followTimelineAt, updateTimelinePlayhead]);
  const onInstrumentalError = useCallback(() => {
    setError(
      t("editor.audioLoadError", {
        code: String(instrumentalAudio.current?.error?.code ?? 0),
      })
    );
    setIsAudioReady(false);
    setIsPlaying(false);
    backgroundVideo.current?.pause();
  }, [t]);
  const onInstrumentalCanPlay = useCallback(() => {
    setIsAudioReady(true);
    setError(null);
  }, []);
  const onBackgroundVideoLoadedMetadata = useCallback(() => {
    setBackgroundMediaReady(true);
    syncBackgroundVideoTime(currentTimeRef.current / 1000);
    if (isPlaying) void backgroundVideo.current?.play().catch(() => undefined);
  }, [isPlaying, syncBackgroundVideoTime]);
  const onBackgroundImageLoaded = useCallback(
    () => setBackgroundMediaReady(true),
    []
  );
  const onSkipBack = useCallback(
    () => onSeek(currentTime - 5_000),
    [currentTime, onSeek]
  );
  const onSkipForward = useCallback(
    () => onSeek(currentTime + 5_000),
    [currentTime, onSeek]
  );
  const onBack = useCallback(
    () =>
      void (async () => {
        await thumbnailCaptureRef.current?.();
        await navigate({ to: "/library" });
      })(),
    [navigate]
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
  const trackPendingDeletion =
    subtitleTracks.find((track) => track.id === trackPendingDeletionId) ?? null;

  const timelineRows = useMemo(() => {
    const priority: Record<ProjectTrack["type"], number> = {
      background: 0,
      image: 1,
      subtitle: 2,
      text: 3,
      audio: 4,
    };
    const icons: Record<ProjectTrack["type"], typeof Image> = {
      background: Image,
      image: Image,
      subtitle: Subtitles,
      text: Type,
      audio: Music2,
    };
    return [...(project?.tracks ?? [])]
      .sort(
        (left, right) =>
          priority[left.type] - priority[right.type] ||
          left.zIndex - right.zIndex
      )
      .map<TimelineRow>((track) => ({
        id: track.id,
        type: track.type,
        label: track.name,
        Icon: icons[track.type],
        track,
      }));
  }, [project?.tracks]);

  const renderSubtitlePreview = useCallback(
    (preview: (typeof subtitlePreviews)[number]) => {
      if (!preview.visible) return null;
      const renderEntryCue = (phraseId: string | undefined) =>
        preview.showEntryCue && preview.entryCuePhrase?.id === phraseId
          ? createElement(
              EntryCue,
              { style: preview.entryCueStyle },
              createElement(
                EntryCueBar,
                undefined,
                createElement(EntryCueBarFill)
              )
            )
          : null;
      return createElement(
        SubtitlePreview,
        { style: preview.containerStyle },
        preview.words.length > 0
          ? createElement(
              CurrentPhrase,
              { style: preview.currentStyle },
              ...preview.words.map((word) =>
                createElement(
                  PreviewWord,
                  {
                    key: word.id,
                    $unreadColor: word.unreadColor,
                    $scale: word.scale,
                    $fontFamily: word.fontFamily,
                    $fontWeight: word.fontWeight,
                    $fontStyle: word.fontStyle,
                    $textDecoration: word.textDecoration,
                    $verticalAlign: word.verticalAlign,
                    "data-subtitle-track-id": preview.id,
                    "data-subtitle-phrase-id":
                      preview.timing.primaryPhrase?.id ?? "",
                    "data-subtitle-word-id": word.id,
                    "data-subtitle-color": "unreadColor",
                    "data-subtitle-color-source": word.unreadColorSource,
                  },
                  word.text,
                  createElement(
                    PreviewWordFill,
                    {
                      $progress: word.progress,
                      $readColor: word.readColor,
                      "data-subtitle-track-id": preview.id,
                      "data-subtitle-phrase-id":
                        preview.timing.primaryPhrase?.id ?? "",
                      "data-subtitle-word-id": word.id,
                      "data-subtitle-color": "readColor",
                      "data-subtitle-color-source": word.readColorSource,
                    },
                    word.text
                  )
                )
              ),
              renderEntryCue(preview.timing.primaryPhrase?.id)
            )
          : null,
        preview.timing.secondaryPhrase
          ? createElement(
              NextPhrase,
              { style: preview.nextPhraseStyle },
              ...(preview.secondaryWords.length > 0
                ? [
                    ...preview.secondaryWords.map((word) =>
                      createElement(
                        PreviewWord,
                        {
                          key: word.id,
                          $unreadColor: word.unreadColor,
                          $scale: word.scale,
                          $fontFamily: word.fontFamily,
                          $fontWeight: word.fontWeight,
                          $fontStyle: word.fontStyle,
                          $textDecoration: word.textDecoration,
                          $verticalAlign: word.verticalAlign,
                          "data-subtitle-track-id": preview.id,
                          "data-subtitle-phrase-id":
                            preview.timing.secondaryPhrase?.id ?? "",
                          "data-subtitle-word-id": word.id,
                          "data-subtitle-color": "unreadColor",
                          "data-subtitle-color-source": word.unreadColorSource,
                        },
                        word.text,
                        createElement(
                          PreviewWordFill,
                          {
                            $progress: word.progress,
                            $readColor: word.readColor,
                            "data-subtitle-track-id": preview.id,
                            "data-subtitle-phrase-id":
                              preview.timing.secondaryPhrase?.id ?? "",
                            "data-subtitle-word-id": word.id,
                            "data-subtitle-color": "readColor",
                            "data-subtitle-color-source": word.readColorSource,
                          },
                          word.text
                        )
                      )
                    ),
                    renderEntryCue(preview.timing.secondaryPhrase.id),
                  ]
                : [
                    preview.timing.secondaryPhrase.text,
                    renderEntryCue(preview.timing.secondaryPhrase.id),
                  ])
            )
          : null
      );
    },
    []
  );

  const renderTimelineLabel = useCallback(
    (row: TimelineRow) =>
      createElement(
        TimelineLabel,
        {
          type: "button",
          $selected: row.id === selectedTrackId,
          onClick: () => {
            setSelectedTrackId(row.id);
            setSelectedPhraseId(null);
            setSelectedWordId(null);
            setInspectorTab("properties");
          },
        },
        createElement(row.Icon, { size: 15 }),
        createElement("span", undefined, row.label)
      ),
    [selectedTrackId]
  );
  const timelineInteractionKey = useMemo(
    () => ({}),
    [
      onHoverPhrase,
      onLeavePhrase,
      onSelectPhrase,
      onSelectWord,
      onSplitPhrase,
      onStartPhraseGesture,
      onStartWordGesture,
      timelineTool,
    ]
  );
  const renderTimelineRow = useCallback(
    (row: TimelineRow) => {
      if (row.track?.type === "subtitle") {
        const track = row.track;
        const preview = subtitlePreviews.find((item) => item.id === track.id);
        const trackPlaybackWordId =
          preview?.playingPhrase?.words.find(
            (word) =>
              word.type !== "gap" &&
              currentTime >= word.start &&
              currentTime <= word.end
          )?.id ?? null;
        const selectedPhraseForTrack =
          track.id === selectedTrackId
            ? (track.phrases.find((phrase) => phrase.id === selectedPhraseId) ??
              preview?.playingPhrase)
            : preview?.playingPhrase;
        return createElement(
          TimelineLane,
          {
            $splitting: timelineTool === "split",
            $dropTarget: track.id === timelineDropTargetTrackId,
            "data-subtitle-track-id": track.id,
            onDoubleClick: (event: MouseEvent<HTMLDivElement>) =>
              onInsertPhrase(event, track),
          },
          ...track.phrases.map((phrase) => {
            const phraseDuration = Math.max(1, phrase.end - phrase.start);
            return createElement(PhraseClip, {
              key: phrase.id,
              phrase,
              left: `${(phrase.start / timelineDuration) * 100}%`,
              width: `${Math.max(0.12, (phraseDuration / timelineDuration) * 100)}%`,
              selected: phrase.id === selectedPhraseForTrack?.id,
              splitting: timelineTool === "split",
              interactionKey: timelineInteractionKey,
              words: phrase.words.map((word) => ({
                ...word,
                left: `${((word.start - phrase.start) / phraseDuration) * 100}%`,
                width: `${Math.max(0.4, ((word.end - word.start) / phraseDuration) * 100)}%`,
                active: word.id === trackPlaybackWordId,
                selected:
                  track.id === selectedTrackId &&
                  word.id === (selectedWordId ?? trackPlaybackWordId),
              })),
              onSelect: (selectedPhrase) =>
                onSelectPhrase(track.id, selectedPhrase),
              onSelectWord: (selectedPhrase, word) =>
                onSelectWord(track.id, selectedPhrase, word),
              onHoverPhrase: (hoveredPhrase, clientX) =>
                onHoverPhrase(track, hoveredPhrase, clientX),
              onLeavePhrase,
              onSplitPhrase: (selectedPhrase, clientX) =>
                onSplitPhrase(track, selectedPhrase, clientX),
              onStartPhraseGesture: (event, selectedPhrase, gesture) =>
                onStartPhraseGesture(event, track, selectedPhrase, gesture),
              onStartWordGesture: (event, selectedPhrase, word, edge) =>
                onStartWordGesture(event, track, selectedPhrase, word, edge),
            });
          })
        );
      }

      return createElement(
        TimelineLane,
        { $splitting: timelineTool === "split", $dropTarget: false },
        createElement(
          TimelineClip,
          {
            type: "button",
            $selected: row.id === selectedTrackId,
            $tone: row.type === "audio" ? "audio" : "background",
            style: { left: 0, width: "100%" },
            onClick: () => {
              setSelectedTrackId(row.id);
              setSelectedPhraseId(null);
              setSelectedWordId(null);
            },
          },
          row.label
        )
      );
    },
    [
      currentTime,
      onInsertPhrase,
      onSelectPhrase,
      onSelectWord,
      onStartPhraseGesture,
      onStartWordGesture,
      onHoverPhrase,
      onLeavePhrase,
      onSplitPhrase,
      selectedPhraseId,
      selectedTrackId,
      selectedWordId,
      subtitlePreviews,
      timelineDropTargetTrackId,
      timelineInteractionKey,
      timelineTool,
      timelineDuration,
    ]
  );
  const renderWord = useCallback(
    (word: SubtitleWord) =>
      createElement(
        WordRow,
        {
          type: "button",
          $active: word.id === selectedWordId || word.id === playbackWordId,
          onClick: () =>
            subtitleTrack &&
            activePhrase &&
            onSelectWord(subtitleTrack.id, activePhrase, word),
        },
        createElement("span", undefined, word.text),
        createElement(
          "span",
          undefined,
          `${formatTime(word.start).slice(3)} – ${formatTime(word.end).slice(3)}`
        )
      ),
    [activePhrase, onSelectWord, playbackWordId, selectedWordId, subtitleTrack]
  );
  const renderCurveOption = useCallback(
    (option: CurveOption) =>
      createElement("option", { value: option.id }, option.label),
    []
  );

  const timelineRenderKey = useMemo(
    () => ({}),
    [
      bpmInputValue,
      data.preferences.storageDirectory,
      project,
      selectedPhraseId,
      selectedTrackId,
      selectedWordId,
      t,
      timelineAutoFollow,
      timelineTool,
      timelineZoom,
    ]
  );
  const sidebarRenderKey = useMemo(
    () => ({}),
    [
      data.preferences.storageDirectory,
      inspectorTab,
      phraseScaleInputValue,
      project,
      selectedPhraseId,
      selectedTrackId,
      selectedWordId,
      t,
      trackPendingDeletionId,
      trackScaleInputValue,
      wordScaleInputValue,
    ]
  );
  const headerRenderKey = useMemo(() => ({}), [project?.name, t]);
  const renderProgressTitle =
    renderProgress?.status === "completed"
      ? t("editor.exportCompleted")
      : renderProgress?.status === "failed"
        ? t("editor.exportFailed")
        : t("editor.exportRendering");
  const renderProgressIcon =
    renderProgress?.status === "completed"
      ? CheckCircle2
      : renderProgress?.status === "failed"
        ? AlertTriangle
        : LoaderCircle;

  return {
    projectName: project?.name ?? t("editor.project", { projectId }),
    error,
    currentTime,
    duration: timelineDuration,
    playheadPercent: (currentTime / Math.max(1, timelineDuration)) * 100,
    isPlaying,
    isAudioReady,
    instrumentalSource,
    vocalsSource,
    instrumentalAudio,
    vocalsAudio,
    backgroundVideo,
    backgroundImage,
    onBackgroundImageLoaded,
    previewCanvas,
    timelineRef,
    timelineLabelsRef,
    timelineContentRef,
    timelinePlayheadRef,
    timelineContentStyle: { width: `${timelineZoom * 100}%` },
    timelineGridStyle,
    timelineAutoFollow,
    splitToolActive: timelineTool === "split",
    bpmInputValue,
    tempoOffsetSeconds: tempoOffset / 1000,
    maximumTempoOffsetSeconds: timelineDuration / 1000,
    instrumentalVolume,
    vocalsVolume,
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
    subtitlePreviews,
    inspectorWords: activePhrase?.words ?? [],
    timelineRows,
    trackStyle,
    fontOptions,
    phraseStyle,
    wordStyle,
    phrasePositionX: activePhrase?.style?.x ?? 0,
    phrasePositionY: activePhrase?.style?.y ?? 0,
    wordPositionX: selectedWord?.style?.x ?? 0,
    wordPositionY: selectedWord?.style?.y ?? 0,
    propertiesActive: inspectorTab === "properties",
    mixerActive: inspectorTab === "mixer",
    savedLabel: t("editor.saved"),
    backLabel: t("editor.back"),
    exportLabel: t("editor.export"),
    exportDialogOpen,
    exportResolution,
    exportFps,
    exportAudioMode,
    exportInstrumentalVolume,
    exportVocalsVolume,
    exportEncodingPreset,
    renderProgress,
    isCancellingExport,
    renderProgressTitle,
    renderProgressIcon,
    exportTitle: t("editor.exportTitle"),
    exportDescription: t("editor.exportDescription"),
    exportAdvancedOptionsLabel: t("editor.exportAdvancedOptions"),
    exportResolutionLabel: t("editor.exportResolution"),
    exportFpsLabel: t("editor.exportFps"),
    exportAudioLabel: t("editor.exportAudio"),
    exportEncodingPresetLabel: t("editor.exportEncodingPreset"),
    exportEncodingPresetNotice: t("editor.exportEncodingPresetNotice"),
    exportMixLabel: t("editor.exportMix"),
    exportVocalsOnlyLabel: t("editor.exportVocalsOnly"),
    exportInstrumentalOnlyLabel: t("editor.exportInstrumentalOnly"),
    exportCancelLabel: t("editor.exportCancel"),
    exportConfirmLabel: t("editor.exportConfirm"),
    exportCloseLabel: t("editor.exportClose"),
    exportRenderingLabel: t("editor.exportRendering"),
    exportCompletedLabel: t("editor.exportCompleted"),
    exportFailedLabel: t("editor.exportFailed"),
    zoomLabel: `${Math.round(timelineZoom * 100)}%`,
    minimizeWindowLabel: t("appLayout.window.minimize"),
    maximizeWindowLabel: t("appLayout.window.maximize"),
    closeWindowLabel: t("appLayout.window.close"),
    zoomResetLabel: t("editor.zoomReset"),
    timelineToolsLabel: t("editor.timelineTools"),
    pointerToolLabel: t("editor.pointerTool"),
    splitToolLabel: t("editor.splitTool"),
    timelineAutoFollowLabel: t("editor.timelineAutoFollow"),
    bpmLabel: t("editor.bpm"),
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
    aspectLabel: "16:9",
    inspectorTitle:
      inspectorTab === "mixer" ? t("editor.mixer") : t("editor.properties"),
    propertiesLabel: t("editor.properties"),
    backgroundTrackSelected: backgroundTrack !== null,
    backgroundPreset,
    backgroundAsset,
    backgroundAssetName,
    backgroundFit,
    backgroundColor: projectBackgroundTrack?.color ?? "#0B1732",
    backgroundGradientStart: projectBackgroundTrack?.gradientStart ?? "#273660",
    backgroundGradientEnd: projectBackgroundTrack?.gradientEnd ?? "#0B1732",
    backgroundGradientAngle: projectBackgroundTrack?.gradientAngle ?? 135,
    backgroundPresetLabel: t("editor.backgroundPreset"),
    backgroundAlbumArtLabel: t("editor.background.albumArt"),
    backgroundVideoLabel: t("editor.background.video"),
    backgroundImageLabel: t("editor.background.image"),
    backgroundSolidLabel: t("editor.background.solid"),
    backgroundGradientLabel: t("editor.background.gradient"),
    backgroundChooseLabel: t("editor.background.choose"),
    backgroundReplaceLabel: t("editor.background.replace"),
    backgroundSelectedFileLabel: t("editor.background.selectedFile", {
      file: backgroundAssetName ?? "",
    }),
    backgroundFitLabel: t("editor.background.fit"),
    backgroundColorLabel: t("editor.background.color"),
    backgroundGradientStartLabel: t("editor.background.gradientStart"),
    backgroundGradientEndLabel: t("editor.background.gradientEnd"),
    backgroundGradientAngleLabel: t("editor.background.gradientAngle"),
    backgroundAssetUrl,
    backgroundStyle,
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
    backgroundClipLabel: t("editor.track.background"),
    titleClipLabel: t("editor.track.text"),
    audioClipLabel: t("editor.track.audio"),
    instrumentalVolumeLabel: t("editor.instrumentalVolume"),
    vocalsVolumeLabel: t("editor.vocalsVolume"),
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(timelineDuration),
    formattedStart: formatTime(activePhrase?.start ?? 0),
    formattedEnd: formatTime(activePhrase?.end ?? 0),
    renderSubtitlePreview,
    renderTimelineLabel,
    renderTimelineRow,
    renderWord,
    renderCurveOption,
    timelineRenderKey,
    sidebarRenderKey,
    headerRenderKey,
    getWordId: (word: SubtitleWord) => word.id,
    getSubtitlePreviewId: (preview: (typeof subtitlePreviews)[number]) =>
      preview.id,
    getTimelineRowId: (row: TimelineRow) => row.id,
    getCurveOptionId: (option: CurveOption) => option.id,
    getFontOptionId: (option: SubtitleFontOption) => option.id,
    onTogglePlayback,
    onOpenExport,
    onStartExport,
    onCloseExportDialog: () => setExportDialogOpen(false),
    onExportResolutionChange: setExportResolution,
    onExportFpsChange: setExportFps,
    onExportAudioModeChange: setExportAudioMode,
    onExportInstrumentalVolumeChange: setExportInstrumentalVolume,
    onExportVocalsVolumeChange: setExportVocalsVolume,
    onExportEncodingPresetChange: setExportEncodingPreset,
    onCancelExport,
    onSeek,
    onSeekInput: (event: ChangeEvent<HTMLInputElement>) =>
      onSeek(Number(event.target.value)),
    onSkipBack,
    onSkipForward,
    onInstrumentalTimeUpdate,
    onPlaybackEnded,
    onInstrumentalError,
    onInstrumentalCanPlay,
    onBackgroundVideoLoadedMetadata,
    onInstrumentalVolumeChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateAudioMix("volume", Number(event.target.value)),
    onVocalsVolumeChange: (event: ChangeEvent<HTMLInputElement>) =>
      updateAudioMix("vocalsVolume", Number(event.target.value)),
    onBackgroundPresetChange,
    onBackgroundAssetImport,
    onBackgroundChange: updateBackground,
    onMinimizeWindow,
    onToggleMaximizeWindow,
    onCloseWindow,
    onBack,
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
    onTimelineClick,
    onTimelineScroll,
    onTimelineAutoFollowChange: (event: ChangeEvent<HTMLInputElement>) =>
      setTimelineAutoFollow(event.target.checked),
    onSelectPointerTool: () => setTimelineTool("pointer"),
    onToggleSplitTool: () =>
      setTimelineTool(timelineTool === "split" ? "pointer" : "split"),
    onBpmInput: (event: ChangeEvent<HTMLInputElement>) =>
      setBpmInputValue(event.target.value),
    onBpmBlur: commitBpmInput,
    onBpmKeyDown,
    onBeatOffsetInput: (event: ChangeEvent<HTMLInputElement>) =>
      updateTempo("offset", Number(event.target.value) * 1000),
    onShowProperties: () => setInspectorTab("properties"),
    onShowMixer: () => setInspectorTab("mixer"),
  };
}

export type EditorBehavior = ReturnType<typeof useBehavior>;
