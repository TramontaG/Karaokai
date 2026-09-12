import {
  Grid2X2,
  MapPin,
  MousePointer2,
  Plus,
  Scissors,
  Trash2,
  Merge,
} from "lucide-react";
import { memo } from "react";
import { ForEach } from "../../../../components/ForEach";
import type { EditorTimelineModel } from "../../../../hooks/editor/componentModels";
import {
  Timeline,
  TimelineBeatGrid,
  TimelineContent,
  TimelineFollowToggle,
  TimelineLabels,
  TimelineMarker,
  TimelineMarkerDeleteButton,
  TimelinePanel,
  TimelinePlayhead,
  TimelineToolbar,
  TimelineToolbarMain,
  TimelineToolbarOptions,
  TimelineToolButton,
  TimelineToolGroup,
  TimelineTrackHeader,
  TimelineViewport,
} from "../../styles";
import { TimelineTempoControl } from "../TimelineTempoControl";
import { TrackLabel } from "../TrackLabel";

function EditorTimelineView({
  model: behavior,
}: {
  model: EditorTimelineModel;
}) {
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
                $active={
                  !behavior.splitToolActive && !behavior.markerToolActive
                }
                aria-pressed={
                  !behavior.splitToolActive && !behavior.markerToolActive
                }
                aria-label={behavior.pointerToolLabel}
                title={behavior.pointerToolLabel}
                onClick={behavior.onSelectPointerTool}
              >
                <MousePointer2 size={14} />
              </TimelineToolButton>
              <TimelineToolButton
                type="button"
                $active={behavior.splitToolActive}
                aria-pressed={behavior.splitToolActive}
                aria-label={behavior.splitToolLabel}
                title={behavior.splitToolLabel}
                onClick={behavior.onToggleSplitTool}
              >
                <Scissors size={14} />
              </TimelineToolButton>
              <TimelineToolButton
                type="button"
                $active={behavior.markerToolActive}
                aria-pressed={behavior.markerToolActive}
                aria-label={behavior.markerToolLabel}
                title={behavior.markerToolLabel}
                onClick={behavior.onToggleMarkerTool}
              >
                <MapPin size={14} />
              </TimelineToolButton>
              <TimelineToolButton
                type="button"
                $active={false}
                aria-label={behavior.joinPhrasesLabel}
                title={behavior.joinPhrasesLabel}
                disabled={behavior.joinPhrasesDisabled}
                onClick={behavior.onJoinPhrases}
              >
                <Merge size={14} />
              </TimelineToolButton>
            </TimelineToolGroup>
            <TimelineToolGroup>
              <TimelineFollowToggle>
                <input
                  type="checkbox"
                  checked={behavior.timelineAutoFollow}
                  onChange={behavior.onTimelineAutoFollowChange}
                />
                <span>{behavior.timelineAutoFollowLabel}</span>
              </TimelineFollowToggle>
              <TimelineFollowToggle>
                <input
                  type="checkbox"
                  checked={behavior.timelineSnapToGrid}
                  onChange={behavior.onSnapToGridChange}
                />
                <span>{behavior.snapToGridLabel}</span>
              </TimelineFollowToggle>
            </TimelineToolGroup>
            <TimelineToolGroup>
              <TimelineTempoControl model={behavior} />
              <TimelineToolButton
                type="button"
                $active={false}
                title={behavior.subdivisionLabel}
                aria-label={behavior.subdivisionLabel}
                onClick={behavior.onSubdivisionChange}
              >
                <Grid2X2 size={14} />
                <span aria-live="polite">{behavior.timelineSubdivision}</span>
              </TimelineToolButton>
            </TimelineToolGroup>
            <TimelineToolButton
              type="button"
              $active={false}
              title={behavior.removeAllTimelineMarkersLabel}
              aria-label={behavior.removeAllTimelineMarkersLabel}
              disabled={behavior.removeAllTimelineMarkersDisabled}
              onClick={behavior.onRemoveAllTimelineMarkers}
            >
              <Trash2 size={14} />
            </TimelineToolButton>
          </TimelineToolbarOptions>
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
                onSelectTrack={behavior.onSelectTrack}
                onRenameTrack={behavior.onRenameTrack}
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
              <TimelineBeatGrid>
                <ForEach
                  data={behavior.timelineGridLines}
                  idCompute={(line) => String(line.time)}
                  render={(line) => (
                    <span
                      data-bar={line.isBar || undefined}
                      style={{
                        left: `${(line.time / behavior.duration) * 100}%`,
                      }}
                    />
                  )}
                />
              </TimelineBeatGrid>
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
            <ForEach
              data={behavior.timelineMarkers}
              idCompute={(marker) => marker.id}
              render={(marker) => (
                <TimelineMarker
                  style={{
                    left: `${(marker.time / behavior.duration) * 100}%`,
                  }}
                >
                  <TimelineMarkerDeleteButton
                    type="button"
                    aria-label={behavior.timelineMarkerDeleteLabel}
                    title={behavior.timelineMarkerDeleteLabel}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      behavior.onRemoveTimelineMarker(marker.id);
                    }}
                  >
                    <Trash2 size={11} />
                  </TimelineMarkerDeleteButton>
                </TimelineMarker>
              )}
            />
          </TimelineContent>
        </TimelineViewport>
      </Timeline>
    </TimelinePanel>
  );
}

export const EditorTimeline = memo(EditorTimelineView);
EditorTimeline.displayName = "EditorTimeline";
