import { memo } from "react";
import { MousePointer2, Plus, Scissors } from "lucide-react";
import { ForEach } from "../../../../components/ForEach";
import { useEditorBehavior, useEditorState } from "../EditorState";
import { TrackLabel } from "../TrackLabel";
import {
  Time,
  Timeline,
  TimelineBeatGrid,
  TimelineContent,
  TimelineFollowToggle,
  TimelineLabels,
  TimelinePanel,
  TimelinePlayhead,
  TimelineTempoField,
  TimelineToolbar,
  TimelineToolbarMain,
  TimelineToolbarOptions,
  TimelineToolButton,
  TimelineToolGroup,
  TimelineTrackHeader,
  TimelineViewport,
} from "../../styles";

function EditorTimelineView() {
  useEditorState((behavior) => behavior.timelineRenderKey);
  const behavior = useEditorBehavior();
  return (
    <TimelinePanel>
      <TimelineToolbar>
        <TimelineTrackHeader>
          <span>{behavior.tracksLabel}</span>
          <button
            type="button"
            aria-label={behavior.addSubtitleTrackLabel}
            title={behavior.addSubtitleTrackLabel}
            onClick={behavior.onAddSubtitleTrack}
          >
            <Plus size={15} />
          </button>
        </TimelineTrackHeader>
        <TimelineToolbarMain>
          <TimelineToolbarOptions>
            <TimelineToolGroup aria-label={behavior.timelineToolsLabel}>
              <TimelineToolButton
                type="button"
                $active={!behavior.splitToolActive}
                aria-pressed={!behavior.splitToolActive}
                title={behavior.pointerToolLabel}
                onClick={behavior.onSelectPointerTool}
              >
                <MousePointer2 size={14} />
                <span>{behavior.pointerToolLabel}</span>
              </TimelineToolButton>
              <TimelineToolButton
                type="button"
                $active={behavior.splitToolActive}
                aria-pressed={behavior.splitToolActive}
                title={behavior.splitToolLabel}
                onClick={behavior.onToggleSplitTool}
              >
                <Scissors size={14} />
                <span>{behavior.splitToolLabel}</span>
              </TimelineToolButton>
            </TimelineToolGroup>
            <TimelineFollowToggle>
              <input
                type="checkbox"
                checked={behavior.timelineAutoFollow}
                onChange={behavior.onTimelineAutoFollowChange}
              />
              <span>{behavior.timelineAutoFollowLabel}</span>
            </TimelineFollowToggle>
            <TimelineTempoField>
              <span>{behavior.bpmLabel}</span>
              <input
                type="number"
                min="20"
                max="400"
                step="0.1"
                value={behavior.bpmInputValue}
                onChange={behavior.onBpmInput}
                onBlur={behavior.onBpmBlur}
                onKeyDown={behavior.onBpmKeyDown}
              />
            </TimelineTempoField>
            <TimelineTempoField>
              <span>{behavior.beatOffsetLabel}</span>
              <input
                type="number"
                min="0"
                max={behavior.maximumTempoOffsetSeconds}
                step="0.01"
                value={behavior.tempoOffsetSeconds}
                onChange={behavior.onBeatOffsetInput}
              />
            </TimelineTempoField>
          </TimelineToolbarOptions>
          <Time>{behavior.formattedDuration}</Time>
        </TimelineToolbarMain>
      </TimelineToolbar>
      <Timeline>
        <TimelineLabels ref={behavior.timelineLabelsRef}>
          <ForEach
            data={behavior.timelineRows}
            idCompute={behavior.getTimelineRowId}
            render={(row) => (
              <TrackLabel
                id={row.id}
                label={row.label}
                Icon={row.Icon}
                selected={row.id === behavior.selectedTrackId}
              />
            )}
          />
        </TimelineLabels>
        <TimelineViewport
          ref={behavior.timelineRef}
          onScroll={behavior.onTimelineScroll}
        >
          <TimelineContent
            ref={behavior.timelineContentRef}
            style={behavior.timelineContentStyle}
            $splitting={behavior.splitToolActive}
            onClick={behavior.onTimelineClick}
          >
            {behavior.hideTimelineGrid ? null : (
              <TimelineBeatGrid style={behavior.timelineGridStyle} />
            )}
            {behavior.hideTimelineClips ? null : (
              <ForEach
                data={behavior.timelineRows}
                idCompute={behavior.getTimelineRowId}
                render={behavior.renderTimelineRow}
              />
            )}
            {behavior.hideTimelinePlayhead ? null : (
              <TimelinePlayhead ref={behavior.timelinePlayheadRef} />
            )}
          </TimelineContent>
        </TimelineViewport>
      </Timeline>
    </TimelinePanel>
  );
}

export const EditorTimeline = memo(EditorTimelineView);
EditorTimeline.displayName = "EditorTimeline";
