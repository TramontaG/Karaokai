import { memo } from "react";
import { Plus } from "lucide-react";
import { ForEach } from "../../../../components/ForEach";
import { useEditorBehavior, useEditorState } from "../EditorState";
import {
  Time,
  Timeline,
  TimelineBeatGrid,
  TimelineContent,
  TimelineFollowToggle,
  TimelineHint,
  TimelineLabels,
  TimelinePanel,
  TimelinePlayhead,
  TimelineTempoField,
  TimelineToolbar,
  TimelineToolbarMain,
  TimelineToolbarOptions,
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
            <TimelineHint>{behavior.zoomHint}</TimelineHint>
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
            render={behavior.renderTimelineLabel}
          />
        </TimelineLabels>
        <TimelineViewport
          ref={behavior.timelineRef}
          onScroll={behavior.onTimelineScroll}
        >
          <TimelineContent
            ref={behavior.timelineContentRef}
            style={behavior.timelineContentStyle}
            onClick={behavior.onTimelineClick}
          >
            <TimelineBeatGrid style={behavior.timelineGridStyle} />
            <TimelinePlayhead
              ref={behavior.timelinePlayheadRef}
              style={{ left: `${behavior.playheadPercent}%` }}
            />
            <ForEach
              data={behavior.timelineRows}
              idCompute={behavior.getTimelineRowId}
              render={behavior.renderTimelineRow}
            />
          </TimelineContent>
        </TimelineViewport>
      </Timeline>
    </TimelinePanel>
  );
}

export const EditorTimeline = memo(EditorTimelineView);
EditorTimeline.displayName = "EditorTimeline";
