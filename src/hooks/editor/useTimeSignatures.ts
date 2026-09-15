import { useCallback, useEffect, useMemo } from "react";
import type { TimeSignature, TimeSignatureMarker } from "../../domain/project";
import { useRecursiveState } from "../useRecursiveState";
import { useTimelineGridPreferences } from "../useTimelineGridPreferences";
import {
  nearestGridTime,
  sortedTimeSignatures,
  tempoGridLines,
  validTimeSignature,
} from "../../util/editor/tempoGrid";
import {
  DEFAULT_BPM,
  MINIMUM_BPM,
  MAXIMUM_BPM,
} from "../../util/editor/constants";
import { clamp } from "../../util/editor/numbers";
import type { EditorDataState } from "./useEditorDataState";
import type { EditorRuntime } from "./useEditorRuntime";
import type { EditorHistory } from "./useEditorHistory";

interface Options {
  editorDataState: Pick<
    EditorDataState,
    "project" | "timelineTool" | "setTimelineTool"
  >;
  editorRuntime: Pick<EditorRuntime, "projectRef" | "timelineContentRef">;
  editorHistory: Pick<EditorHistory, "persistProject">;
  duration: number;
}

export function useTimeSignatures({
  editorDataState,
  editorRuntime,
  editorHistory,
  duration,
}: Options) {
  const { project, timelineTool, setTimelineTool } = editorDataState;
  const { projectRef, timelineContentRef } = editorRuntime;
  const { persistProject } = editorHistory;
  const { timelineSubdivision } = useTimelineGridPreferences();
  const [state, setState] = useRecursiveState({
    placing: false,
    numerator: 4,
    denominator: 4,
  });
  const markers = useMemo(
    () => sortedTimeSignatures(project?.tempo?.timeSignatures),
    [project?.tempo?.timeSignatures]
  );
  const cancel = useCallback(() => setState({ placing: false }), [setState]);
  useEffect(() => {
    cancel();
  }, [project?.id, cancel]);
  useEffect(() => {
    if (timelineTool !== "pointer") cancel();
  }, [timelineTool, cancel]);
  useEffect(() => {
    if (!state.placing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [state.placing, cancel]);

  const write = useCallback(
    (next: TimeSignatureMarker[]) => {
      const source = projectRef.current;
      if (!source) return;
      persistProject({
        ...source,
        updatedAt: String(Date.now()),
        tempo: {
          bpm: DEFAULT_BPM,
          offset: 0,
          ...source.tempo,
          timeSignatures: sortedTimeSignatures(next),
        },
      });
    },
    [persistProject, projectRef]
  );

  const gridWithout = useCallback(
    (excludeId?: string) => {
      const tempo = projectRef.current?.tempo;
      return tempoGridLines(
        duration,
        clamp(tempo?.bpm ?? DEFAULT_BPM, MINIMUM_BPM, MAXIMUM_BPM),
        clamp(tempo?.offset ?? 0, 0, duration),
        timelineSubdivision,
        tempo?.timeSignatures?.filter((marker) => marker.id !== excludeId),
        tempo?.changes
      );
    },
    [duration, timelineSubdivision, projectRef, project?.tempo]
  );
  const grid = useMemo(() => gridWithout(), [gridWithout]);
  const snap = useCallback(
    (time: number) => nearestGridTime(grid, clamp(time, 0, duration)),
    [grid, duration]
  );
  const positionAt = useCallback(
    (clientX: number) => {
      const bounds = timelineContentRef.current?.getBoundingClientRect();
      return bounds
        ? clamp(
            ((clientX - bounds.left) / bounds.width) * duration,
            0,
            duration
          )
        : 0;
    },
    [duration, timelineContentRef]
  );
  const setDraft = useCallback(
    (signature: TimeSignature) => {
      if (validTimeSignature(signature)) setState(signature);
    },
    [setState]
  );
  const begin = useCallback(() => {
    setTimelineTool("pointer");
    setState({ placing: true });
  }, [setTimelineTool, setState]);
  const place = useCallback(
    (time: number) => {
      if (!grid.length) return;
      const at = snap(time);
      const existing = projectRef.current?.tempo?.timeSignatures ?? [];
      write([
        ...existing.filter((marker) => Math.abs(marker.time - at) > 1e-5),
        {
          id: crypto.randomUUID(),
          time: at,
          numerator: state.numerator,
          denominator: state.denominator,
        },
      ]);
      cancel();
    },
    [grid, snap, state.numerator, state.denominator, write, cancel, projectRef]
  );
  const update = useCallback(
    (id: string, signature: TimeSignature) => {
      if (!validTimeSignature(signature)) return;
      const current = projectRef.current?.tempo?.timeSignatures?.find(
        (marker) => marker.id === id
      );
      if (
        !current ||
        (current.numerator === signature.numerator &&
          current.denominator === signature.denominator)
      )
        return;
      write(
        (projectRef.current?.tempo?.timeSignatures ?? []).map((marker) =>
          marker.id === id ? { ...marker, ...signature } : marker
        )
      );
    },
    [write, projectRef]
  );
  const remove = useCallback(
    (id: string) => {
      write(
        (projectRef.current?.tempo?.timeSignatures ?? []).filter(
          (marker) => marker.id !== id
        )
      );
    },
    [write, projectRef]
  );
  const move = useCallback(
    (id: string, time: number) => {
      const existing = projectRef.current?.tempo?.timeSignatures ?? [];
      if (
        existing.some(
          (marker) => marker.id !== id && Math.abs(marker.time - time) < 1e-5
        )
      )
        return;
      if (existing.find((marker) => marker.id === id)?.time === time) return;
      write(
        existing.map((marker) =>
          marker.id === id ? { ...marker, time } : marker
        )
      );
    },
    [write, projectRef]
  );
  return useMemo(
    () => ({
      ...state,
      markers,
      setDraft,
      begin,
      cancel,
      place,
      update,
      remove,
      move,
      snap,
      gridWithout,
      positionAt,
      duration,
      disabled: !grid.length,
    }),
    [
      state,
      markers,
      setDraft,
      begin,
      cancel,
      place,
      update,
      remove,
      move,
      snap,
      gridWithout,
      positionAt,
      duration,
      grid.length,
    ]
  );
}

export type TimeSignaturesModel = ReturnType<typeof useTimeSignatures>;
