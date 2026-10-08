import { useNavigate, useParams } from "@tanstack/react-router";
import { CircleCheck, CircleDashed, CircleX, LoaderCircle } from "lucide-react";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { type ProjectStage } from "../../domain/project";
import { useAppContext } from "../../hooks/useAppContext";
import { useTranslation } from "../../hooks/useTranslation";
import {
  continueProjectProcessing,
  confirmProjectTrack,
  loadProject,
  lookupProjectLyrics,
  retryProjectTranscription,
  type LrclibLyrics,
} from "../../services/projects";
import { PreparationStage, StageProgress, StageProgressFill } from "./styles";

const stageKey = {
  import: "preparing.stages.import",
  separation: "preparing.stages.separation",
  transcription: "preparing.stages.transcription",
  subtitles: "preparing.stages.subtitles",
} as const;

const statusKey = {
  pending: "preparing.status.pending",
  running: "preparing.status.running",
  completed: "preparing.status.completed",
  failed: "preparing.status.failed",
} as const;

const statusIcon = {
  pending: CircleDashed,
  running: LoaderCircle,
  completed: CircleCheck,
  failed: CircleX,
} as const;

export function useBehavior(_: Record<string, never>) {
  const { projectId } = useParams({ from: "/projects/$projectId/preparing" });
  const { t } = useTranslation();
  const [data, setAppData] = useAppContext();
  const navigate = useNavigate();
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [projectName, setProjectName] = useState(projectId);
  const [lyrics, setLyrics] = useState("");
  const [isStartingTranscription, setIsStartingTranscription] = useState(false);
  const [processingHasLyrics, setProcessingHasLyrics] = useState<
    boolean | null
  >(null);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [trackStep, setTrackStep] = useState<
    | "loading"
    | "metadata"
    | "searching"
    | "review"
    | "manual"
    | "legacy"
    | "lookupError"
    | "noLyrics"
    | "processing"
  >("loading");
  const [trackError, setTrackError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lrclibLyrics, setLrclibLyrics] = useState<LrclibLyrics | null>(null);
  const initialized = useRef(false);
  const opened = useRef(false);
  const searchLyrics = useCallback(async () => {
    setTrackStep("searching");
    setLookupError(null);
    try {
      const found = await lookupProjectLyrics(
        projectId,
        data.preferences.storageDirectory
      );
      setLrclibLyrics(found);
      setTrackStep(found ? "review" : "noLyrics");
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : String(error));
      setTrackStep("lookupError");
    }
  }, [data.preferences.storageDirectory, projectId]);
  const refresh = useCallback(async () => {
    try {
      const project = await loadProject(
        projectId,
        data.preferences.storageDirectory
      );
      if (!project) {
        setAppData({ currentProject: null });
        await navigate({ to: "/library" });
        return;
      }
      setProjectName(project.name);
      setStages(project.processing);
      if (!initialized.current) {
        initialized.current = true;
        if (project.metadataConfirmed === false) {
          setArtist(project.artist?.trim() ?? "");
          setSong(project.song?.trim() || project.name);
          setTrackStep("metadata");
        } else if (project.lyricsQueued) {
          setTrackStep("processing");
        } else if (
          project.metadataConfirmed &&
          project.artist &&
          project.song
        ) {
          setArtist(project.artist);
          setSong(project.song);
          if (
            project.processing.find((stage) => stage.id === "transcription")
              ?.status === "pending"
          ) {
            void searchLyrics();
          } else {
            setTrackStep("processing");
          }
        } else {
          setTrackStep("legacy");
        }
      }
      setAppData({ currentProject: { id: project.id, name: project.name } });
    } catch {
      setStages((current) => current);
    }
  }, [
    data.preferences.storageDirectory,
    projectId,
    setAppData,
    navigate,
    searchLyrics,
  ]);
  const onUseManualLyrics = useCallback(() => setTrackStep("manual"), []);
  const onConfirmTrack = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setTrackError(null);
      try {
        const project = await confirmProjectTrack(
          projectId,
          artist,
          song,
          data.preferences.storageDirectory
        );
        setProjectName(project.name);
        setAppData({ currentProject: { id: project.id, name: project.name } });
        await searchLyrics();
      } catch (error) {
        setTrackError(error instanceof Error ? error.message : String(error));
      }
    },
    [
      artist,
      song,
      data.preferences.storageDirectory,
      projectId,
      searchLyrics,
      setAppData,
    ]
  );

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const completedCount = stages.filter(
    (stage) => stage.status === "completed"
  ).length;
  const hasFailed = stages.some((stage) => stage.status === "failed");
  const isComplete = stages.length > 0 && completedCount === stages.length;
  const awaitingLyrics =
    (trackStep === "manual" || trackStep === "legacy") &&
    !isStartingTranscription &&
    !hasFailed &&
    stages.find((stage) => stage.id === "transcription")?.status === "pending";
  const separationReady =
    stages.find((stage) => stage.id === "separation")?.status === "completed";
  const onLyricsChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setLyrics(event.target.value),
    []
  );
  const onStartTranscription = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isStartingTranscription) return;
      const submitter = (event.nativeEvent as SubmitEvent)
        .submitter as HTMLButtonElement | null;
      const submittedLyrics = submitter?.name === "skipLyrics" ? "" : lyrics;
      const start = async () => {
        const previousStep = trackStep;
        setProcessingHasLyrics(Boolean(submittedLyrics.trim()));
        setIsStartingTranscription(true);
        setLyricsError(null);
        setTrackStep("processing");
        try {
          await continueProjectProcessing(
            projectId,
            submittedLyrics,
            data.preferences.storageDirectory
          );
          await refresh();
        } catch (error) {
          setLyricsError(
            error instanceof Error ? error.message : String(error)
          );
          setTrackStep(previousStep);
        } finally {
          setIsStartingTranscription(false);
        }
      };
      void start();
    },
    [
      data.preferences.storageDirectory,
      isStartingTranscription,
      lyrics,
      projectId,
      refresh,
      trackStep,
    ]
  );
  const onAcceptLrclib = useCallback(async () => {
    if (!lrclibLyrics || isStartingTranscription) return;
    setProcessingHasLyrics(true);
    setIsStartingTranscription(true);
    setLyricsError(null);
    setTrackStep("processing");
    try {
      await continueProjectProcessing(
        projectId,
        lrclibLyrics.plainLyrics,
        data.preferences.storageDirectory,
        lrclibLyrics.syncedLyrics
      );
      await refresh();
    } catch (error) {
      setLyricsError(error instanceof Error ? error.message : String(error));
      setTrackStep("review");
    } finally {
      setIsStartingTranscription(false);
    }
  }, [
    data.preferences.storageDirectory,
    isStartingTranscription,
    lrclibLyrics,
    projectId,
    refresh,
  ]);
  const onRejectLrclib = useCallback(() => {
    setLrclibLyrics(null);
    setTrackStep("manual");
  }, []);
  const onOpenEditor = useCallback(() => {
    opened.current = true;
    void navigate({ to: "/projects/$projectId/editor", params: { projectId } });
  }, [navigate, projectId]);
  const onRetryTranscription = useCallback(async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryError(null);
    try {
      const result = await retryProjectTranscription(
        projectId,
        data.preferences.storageDirectory
      );
      setProcessingHasLyrics(result.hasLyrics);
      setTrackStep("processing");
      await refresh();
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRetrying(false);
    }
  }, [data.preferences.storageDirectory, isRetrying, projectId, refresh]);
  useEffect(() => {
    if (isComplete && !opened.current) onOpenEditor();
  }, [isComplete, onOpenEditor]);
  const uiStages = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        progress:
          stage.status === "completed"
            ? 100
            : (stage.progress ?? (stage.status === "running" ? 8 : 0)),
        label: t(stageKey[stage.id]),
        statusLabel:
          stage.status === "running"
            ? t("preparing.status.runningProgress", {
                progress: String(Math.round(stage.progress ?? 0)),
              })
            : t(statusKey[stage.status]),
        failureDetails:
          stage.status === "failed" && stage.message?.trim()
            ? stage.message
            : null,
        Icon: statusIcon[stage.status],
      })),
    [stages, t]
  );
  const renderStage = useCallback(
    (stage: (typeof uiStages)[number]) =>
      createElement(
        PreparationStage,
        { $status: stage.status },
        createElement(stage.Icon, { "aria-hidden": true, size: 20 }),
        createElement(
          "div",
          undefined,
          createElement("strong", undefined, stage.label),
          createElement("span", undefined, stage.statusLabel),
          stage.failureDetails
            ? createElement(
                "span",
                { "data-error-details": true, role: "alert" },
                stage.failureDetails
              )
            : null,
          createElement(
            StageProgress,
            undefined,
            createElement(StageProgressFill, {
              $status: stage.status,
              style: { width: `${stage.progress}%` },
            })
          )
        )
      ),
    []
  );

  return {
    title: t("preparing.title", { project: projectName }),
    description: t(
      hasFailed ? "preparing.description.failed" : "preparing.description"
    ),
    progress:
      stages.length === 0
        ? 0
        : Math.round((completedCount / stages.length) * 100),
    progressLabel: t("preparing.progress", {
      completed: String(completedCount),
      total: String(stages.length || 4),
    }),
    stages: uiStages,
    renderStage,
    getStageId: (stage: (typeof uiStages)[number]) => stage.id,
    hasFailed,
    canOpenEditor:
      hasFailed &&
      stages.find((stage) => stage.id === "separation")?.status === "completed",
    canRetryTranscription:
      stages.find((stage) => stage.id === "transcription")?.status ===
        "failed" &&
      stages.find((stage) => stage.id === "separation")?.status === "completed",
    retryTranscriptionLabel: t("preparing.retryTranscription"),
    retryingTranscriptionLabel: t("preparing.retryingTranscription"),
    isRetrying,
    retryError,
    onRetryTranscription,
    awaitingLyrics,
    showTrackLoading: trackStep === "loading" || trackStep === "searching",
    showMetadata: trackStep === "metadata",
    showLrclib: trackStep === "review",
    showProcessingNotice:
      trackStep === "processing" && !hasFailed && !isComplete,
    processingNotice: t(
      isStartingTranscription
        ? processingHasLyrics
          ? "preparing.lyrics.startingAlignment"
          : "preparing.lyrics.startingProcessing"
        : !separationReady
          ? processingHasLyrics
            ? "preparing.lyrics.waitingForSeparation"
            : "preparing.lyrics.waitingForSeparationWithoutLyrics"
          : processingHasLyrics
            ? "preparing.lyrics.aligning"
            : "preparing.lyrics.processing"
    ),
    showLookupError: trackStep === "lookupError",
    showNoLyrics: trackStep === "noLyrics",
    noLyricsTitle: t("preparing.lrclib.noLyricsTitle"),
    noLyricsDescription: t("preparing.lrclib.noLyricsDescription"),
    lookupErrorTitle: t("preparing.lrclib.lookupErrorTitle"),
    lookupErrorMessage: lookupError?.includes("LRCLIB_UNAVAILABLE")
      ? t("preparing.lrclib.unavailable")
      : lookupError?.includes("LRCLIB_RATE_LIMITED")
        ? t("preparing.lrclib.rateLimited")
        : lookupError?.includes("LRCLIB_NETWORK")
          ? t("preparing.lrclib.networkError")
          : t("preparing.lrclib.lookupError", { details: lookupError ?? "" }),
    retryLookupLabel: t("preparing.lrclib.retry"),
    manualLyricsLabel: t("preparing.lrclib.manual"),
    onRetryLookup: searchLyrics,
    onUseManualLyrics,
    trackLoadingText: t(
      trackStep === "searching"
        ? "preparing.track.searching"
        : "preparing.track.loading"
    ),
    trackTitle: t("preparing.track.title"),
    trackDescription: t("preparing.track.description"),
    artistLabel: t("preparing.track.artist"),
    songLabel: t("preparing.track.song"),
    artist,
    song,
    trackError,
    onArtistChange: (event: ChangeEvent<HTMLInputElement>) =>
      setArtist(event.target.value),
    onSongChange: (event: ChangeEvent<HTMLInputElement>) =>
      setSong(event.target.value),
    onConfirmTrack,
    confirmTrackLabel: t("preparing.track.confirm"),
    lrclibTitle: t("preparing.lrclib.title"),
    lrclibDescription: t(
      lrclibLyrics?.syncedLyrics
        ? "preparing.lrclib.description"
        : "preparing.lrclib.plainDescription"
    ),
    lrclibWarning: lrclibLyrics?.syncLookupError
      ? t("preparing.lrclib.syncSearchUnavailable")
      : null,
    lrclibLyrics: lrclibLyrics?.plainLyrics ?? "",
    acceptLrclibLabel: t("preparing.lrclib.accept"),
    rejectLrclibLabel: t("preparing.lrclib.reject"),
    onAcceptLrclib,
    onRejectLrclib,
    canStartLrclib: !hasFailed && !isStartingTranscription,
    lyrics,
    lyricsError,
    isStartingTranscription,
    onLyricsChange,
    onStartTranscription,
    openEditor: t("preparing.openEditor"),
    lyricsTitle: t("preparing.lyrics.title"),
    lyricsDescription: t("preparing.lyrics.description"),
    lyricsFieldLabel: t("preparing.lyrics.fieldLabel"),
    lyricsPlaceholder: t("preparing.lyrics.placeholder"),
    lyricsContinue: t("preparing.lyrics.continue"),
    lyricsSkip: t("preparing.lyrics.skip"),
    lyricsStarting: t("preparing.lyrics.starting"),
    onOpenEditor,
  };
}
