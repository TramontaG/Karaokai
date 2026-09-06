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
  chooseAudioFile,
  desktopFilePath,
  isDesktop,
} from "../../services/desktop";
import { createLocalProject } from "../../services/projects";
import { useTranslation } from "../../hooks/useTranslation";

export function useBehavior(_: Record<string, never>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setAppData] = useAppContext();
  const [isImporting, setIsImporting] = useState(false);
  const isImportingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
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
        await importAudioPath((await chooseAudioFile()) ?? undefined);
      } else {
        fileInputRef.current?.click();
      }
    };
    void choose().catch((reason) =>
      setError(reason instanceof Error ? reason.message : String(reason))
    );
  }, [importAudioPath]);
  const onYoutubeSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  return {
    acceptedFiles: ".mp3,.wav,.flac,.m4a,.aac,.ogg,audio/*",
    dropTitle: t("home.import.dropTitle"),
    supportedFormats: t("home.import.supportedFormats"),
    chooseFile: t("home.import.chooseFile"),
    fileInputLabel: t("home.import.fileInputLabel"),
    separator: t("home.import.separator"),
    youtubePlaceholder: t("home.import.youtubePlaceholder"),
    youtubeInputLabel: t("home.import.youtubeInputLabel"),
    download: t("home.import.download"),
    onYoutubeSubmit,
    onFileChange,
    fileInputRef,
    onChooseFile,
    onDrop,
    onDragOver,
    isImporting,
    error,
  };
}
