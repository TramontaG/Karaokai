import { useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useAppContext } from "../../hooks/useAppContext";
import {
  chooseMediaFile,
  desktopFilePath,
  isDesktop,
} from "../../services/desktop";
import {
  createLocalProject,
  createYoutubeProject,
} from "../../services/projects";
import { youtubeImportError } from "../../services/userFacingErrors";
import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setAppData] = useAppContext();
  const [isImporting, setIsImporting] = useState(false);
  const [isYoutubeImporting, setIsYoutubeImporting] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const isImportingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importAudioPath = useCallback(
    async (sourcePath: string | undefined) => {
      if (!sourcePath || isImportingRef.current) return;
      isImportingRef.current = true;
      setIsImporting(true);
      setError(null);
      try {
        const project = await createLocalProject(
          sourcePath,
          data.preferences.storageDirectory,
          {
            whisperModelId: data.preferences.defaultWhisperModelId,
            demucsModelId: data.preferences.defaultDemucsModelId,
          }
        );
        setAppData({
          currentProject: { id: project.id, name: project.name },
        });
        await navigate({
          to: "/projects/$projectId/preparing",
          params: { projectId: project.id },
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        isImportingRef.current = false;
        setIsImporting(false);
      }
    },
    [
      data.preferences.defaultDemucsModelId,
      data.preferences.defaultWhisperModelId,
      data.preferences.storageDirectory,
      navigate,
      setAppData,
    ]
  );
  const importFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const sourcePath = isDesktop()
        ? desktopFilePath(file)
        : ((file as File & { path?: string }).path ?? file.name);
      void importAudioPath(sourcePath);
    },
    [importAudioPath]
  );
  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void importFile(event.target.files?.[0]);
      event.target.value = "";
    },
    [importFile]
  );
  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      void importFile(event.dataTransfer.files[0]);
    },
    [importFile]
  );
  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => event.preventDefault(),
    []
  );
  const onChooseFile = useCallback(() => {
    const choose = async () => {
      if (isDesktop()) {
        await importAudioPath((await chooseMediaFile()) ?? undefined);
      } else {
        fileInputRef.current?.click();
      }
    };
    void choose().catch((reason) =>
      setError(reason instanceof Error ? reason.message : String(reason))
    );
  }, [importAudioPath]);
  const onYoutubeUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setYoutubeUrl(event.target.value);
    },
    []
  );
  const onCloseYoutubeError = useCallback(() => {
    setYoutubeError(null);
    setError(null);
  }, []);
  const onYoutubeSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const importYoutube = async () => {
        if (isImportingRef.current) return;
        isImportingRef.current = true;
        setIsImporting(true);
        setIsYoutubeImporting(true);
        setError(null);
        setYoutubeError(null);
        try {
          const project = await createYoutubeProject(
            youtubeUrl,
            data.preferences.storageDirectory,
            {
              whisperModelId: data.preferences.defaultWhisperModelId,
              demucsModelId: data.preferences.defaultDemucsModelId,
            }
          );
          setAppData({
            currentProject: { id: project.id, name: project.name },
          });
          await navigate({
            to: "/projects/$projectId/preparing",
            params: { projectId: project.id },
          });
        } catch (reason) {
          setYoutubeError(
            t(`home.import.youtubeError.${youtubeImportError(reason)}`)
          );
        } finally {
          isImportingRef.current = false;
          setIsImporting(false);
          setIsYoutubeImporting(false);
        }
      };
      void importYoutube();
    },
    [
      data.preferences.defaultDemucsModelId,
      data.preferences.defaultWhisperModelId,
      data.preferences.storageDirectory,
      navigate,
      setAppData,
      t,
      youtubeUrl,
    ]
  );

  return {
    acceptedFiles:
      ".mp3,.wav,.flac,.m4a,.aac,.ogg,.mp4,.mov,.webm,.mkv,audio/*,video/*",
    dropTitle: t("home.import.dropTitle"),
    supportedFormats: t("home.import.supportedFormats"),
    chooseFile: t("home.import.chooseFile"),
    fileInputLabel: t("home.import.fileInputLabel"),
    separator: t("home.import.separator"),
    youtubePlaceholder: t("home.import.youtubePlaceholder"),
    youtubeInputLabel: t("home.import.youtubeInputLabel"),
    download: t("home.import.download"),
    importing: t("home.import.importing"),
    youtubeDownloading: t("home.import.youtubeDownloading"),
    youtubeDialogTitle: youtubeError
      ? t("home.import.youtubeDownloadFailed")
      : t("home.import.youtubeDownloading"),
    closeYoutubeDialog: t("home.import.closeYoutubeDialog"),
    onYoutubeSubmit,
    onYoutubeUrlChange,
    youtubeUrl,
    onFileChange,
    fileInputRef,
    onChooseFile,
    onDrop,
    onDragOver,
    isImporting,
    isYoutubeImporting,
    youtubeDialogOpen: isYoutubeImporting || youtubeError !== null,
    youtubeDialogError: youtubeError,
    youtubeDialogDismissible: youtubeError !== null,
    fileActionLabel: isImporting
      ? t("home.import.importing")
      : t("home.import.chooseFile"),
    youtubeActionLabel: isImporting
      ? t("home.import.importing")
      : t("home.import.download"),
    error,
    onCloseYoutubeError,
  };
}
