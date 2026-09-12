import { useTimelineGridPreferences } from "../useTimelineGridPreferences";
import {
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  DEFAULT_BPM,
  MAXIMUM_BPM,
  MINIMUM_BPM,
} from "../../util/editor/constants";
import { clamp } from "../../util/editor/numbers";
import { tempoGridLines } from "../../util/editor/tempoGrid";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorHistory } from "./useEditorHistory";
import type { EditorProjectValues } from "./useEditorProjectValues";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorTransientState } from "./useEditorTransientState";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    "project" | "setBpmInputValue" | "bpmInputValue"
  >;
  editorProjectValues: Pick<EditorProjectValues, "timelineDuration">;
  editorRuntime: Pick<EditorRuntime, "projectRef">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  editorTransientState: Pick<EditorTransientState, "setTimelineMarkers">;
}

export function useTimelineTempo({
  editorDataState,
  editorProjectValues,
  editorRuntime,
  editorHistory,
  editorTransientState,
}: Options) {
  const { project, setBpmInputValue, bpmInputValue } = editorDataState;
  const { timelineDuration } = editorProjectValues;
  const { projectRef } = editorRuntime;
  const { persistProject } = editorHistory;
  const { setTimelineMarkers } = editorTransientState;
  const tempoBpm = clamp(
    project?.tempo?.bpm ?? DEFAULT_BPM,
    MINIMUM_BPM,
    MAXIMUM_BPM
  );

  const tempoOffset = clamp(project?.tempo?.offset ?? 0, 0, timelineDuration);

  const { timelineSubdivision } = useTimelineGridPreferences();

  const timelineGridLines = useMemo(
    () =>
      tempoGridLines(
        timelineDuration,
        tempoBpm,
        tempoOffset,
        timelineSubdivision
      ),
    [tempoBpm, tempoOffset, timelineDuration, timelineSubdivision]
  );

  useEffect(() => setBpmInputValue(String(tempoBpm)), [tempoBpm]);

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

  const addTimelineMarkerAt = useCallback(
    (value: number) => {
      const time = clamp(value, 0, timelineDuration);
      setTimelineMarkers((markers) => [
        ...markers,
        { id: crypto.randomUUID(), time },
      ]);
    },
    [timelineDuration]
  );
  const removeTimelineMarker = useCallback((id: string) => {
    setTimelineMarkers((markers) =>
      markers.filter((marker) => marker.id !== id)
    );
  }, []);
  const removeAllTimelineMarkers = useCallback(() => {
    setTimelineMarkers([]);
  }, [setTimelineMarkers]);

  return {
    removeAllTimelineMarkers,
    addTimelineMarkerAt,
    timelineGridLines,
    tempoOffset,
    removeTimelineMarker,
    commitBpmInput,
    onBpmKeyDown,
    updateTempo,
  };
}

export type TimelineTempo = ReturnType<typeof useTimelineTempo>;
