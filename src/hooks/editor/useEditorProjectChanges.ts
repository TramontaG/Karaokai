import { useCallback } from "react";
import {
  createProjectThumbnail,
  type KaraokeProject,
  normalizeSubtitlePhraseOrder,
} from "../../domain/project";
import { isDesktop } from "../../services/desktop";
import { saveProject } from "../../services/projects";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorEnvironment } from "./useEditorEnvironment";
import type { EditorRuntime } from "./useEditorRuntime";

interface Options {
  editorRuntime: Pick<
    EditorRuntime,
    "exportLockRef" | "projectRef" | "saveTimerRef"
  >;
  editorDataState: Pick<EditorDataState, "setProject" | "setError">;
  editorEnvironment: Pick<EditorEnvironment, "data">;
}

export function useEditorProjectChanges({
  editorRuntime,
  editorDataState,
  editorEnvironment,
}: Options) {
  const { exportLockRef, projectRef, saveTimerRef } = editorRuntime;
  const { setProject, setError } = editorDataState;
  const { data } = editorEnvironment;
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
  return { applyProject, setLiveProject, saveProjectNow };
}

export type EditorProjectChanges = ReturnType<typeof useEditorProjectChanges>;
