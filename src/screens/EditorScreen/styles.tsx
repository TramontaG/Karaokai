import styled from "@emotion/styled";

export const EditorPage = styled.main`
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) 19.5rem;
  grid-template-rows: auto minmax(0, 1fr);
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 1150px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
`;
export const Workspace = styled.section`
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(15rem, 1fr) auto minmax(13rem, 0.72fr);
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 1150px) {
    border-right: 0;
  }
`;
export const EditorHeader = styled.header`
  grid-column: 1 / -1;
  display: flex;
  min-height: 4rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  user-select: none;
  -webkit-app-region: drag;

  button {
    -webkit-app-region: no-drag;
  }

  @media (max-width: 780px) {
    padding-inline: 0.6rem;
  }
`;
export const ProjectTitle = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.7rem;
  flex: 1;

  button {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    place-items: center;
    color: ${({ theme }) => theme.colors.textMuted};
    background: ${({ theme }) => theme.colors.surface};
    cursor: pointer;
  }
  h1 {
    overflow: hidden;
    margin: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1rem;
  }
`;
export const SavedState = styled.span`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  svg {
    color: #74e5a6;
  }
  @media (max-width: 780px) {
    display: none;
  }
`;
export const HeaderActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.55rem;
  button {
    height: 2.2rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    padding: 0 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-size: 0.72rem;
    white-space: nowrap;
    cursor: pointer;
  }
  & button[data-action="export"] {
    border-color: transparent;
    color: #261333;
    background: linear-gradient(115deg, #bd65f2, #dc8dff);
    font-weight: 700;
  }
  @media (max-width: 780px) {
    > span {
      display: none;
    }
  }
`;
export const HeaderLabel = styled.span`
  display: flex;
  height: 2.2rem;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.45rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.72rem;
  white-space: nowrap;
  cursor: default;
`;
export const HeaderWindowActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.35rem;
  -webkit-app-region: no-drag;
`;
export const HeaderWindowAction = styled.button`
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }

  &:last-child:hover {
    color: #fff;
    background: #d53f50;
  }
`;
export const RenderProgress = styled.section`
  position: absolute;
  z-index: 20;
  top: 4.5rem;
  right: 1rem;
  display: grid;
  width: min(19rem, calc(100vw - 2rem));
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.45rem 0.7rem;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 94%,
    transparent
  );
  box-shadow: 0 0.8rem 2rem rgb(0 0 0 / 25%);
  font-size: 0.7rem;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-variant-numeric: tabular-nums;
  }
  small {
    grid-column: 1;
    color: #ff9caf;
    font-size: 0.62rem;
    line-height: 1.35;
  }
  button {
    grid-column: 2;
    min-height: 1.8rem;
    padding: 0 0.55rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.3rem;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
`;
export const RenderProgressBar = styled.div<{ $progress: number }>`
  grid-column: 1 / -1;
  height: 0.32rem;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.border};
  &::before {
    display: block;
    width: ${({ $progress }) => `${Math.max(0, Math.min(100, $progress))}%`};
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #bd65f2, #dc8dff);
    content: "";
    transition: width 100ms linear;
  }
`;
export const PreviewArea = styled.section`
  display: grid;
  min-height: 0;
  padding: 1rem;
  place-items: center;
  container-type: size;
  background: #08080d;
`;
export const PreviewCanvas = styled.div`
  position: relative;
  display: grid;
  width: min(100cqw, calc(100cqh * 16 / 9), 56rem);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.35rem;
  place-items: center;
  container-type: inline-size;
  background:
    linear-gradient(180deg, rgba(40, 31, 79, 0.2), rgba(6, 11, 31, 0.72)),
    radial-gradient(
      ellipse at 50% 15%,
      #895a7e 0%,
      #273660 34%,
      #0b1732 66%,
      #030711 100%
    );
  box-shadow: inset 0 0 6rem rgb(0 0 0 / 40%);
  &::before {
    position: absolute;
    right: -12%;
    bottom: -25%;
    left: -12%;
    height: 57%;
    background:
      repeating-linear-gradient(
        3deg,
        transparent 0 1.4rem,
        rgb(175 115 255 / 12%) 1.45rem 1.55rem
      ),
      linear-gradient(180deg, transparent, #080c1e);
    content: "";
  }

  &[data-render-preview="true"] {
    width: 100vw;
    height: 100vh;
    aspect-ratio: auto;
    border-radius: 0;
  }

  &[data-render-video-overlay="true"] {
    background: transparent;
    box-shadow: none;

    &::before {
      display: none;
    }
  }
`;
export const PreviewBackground = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  background: #0b1732;

  img,
  video,
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--background-fit, cover);
  }
`;
export const SubtitlePreview = styled.div`
  position: absolute;
  z-index: 1;
  top: 38%;
  left: 50%;
  width: 88%;
  transform: translateX(-50%);
  text-align: center;
  text-shadow:
    0 0.16rem 0.2rem #000,
    0 0 0.45rem #000;
  font-size: 3cqw;
  font-weight: 800;
  line-height: 1.3;
`;
export const CurrentPhrase = styled.p`
  margin: 0;
  will-change: opacity;
`;
export const PreviewWord = styled.span<{
  $unreadColor: string;
  $scale: number;
}>`
  position: relative;
  display: inline-block;
  margin-right: 0.25em;
  color: ${({ $unreadColor }) => $unreadColor};
  font-size: ${({ $scale }) => `${$scale}em`};
`;
export const PreviewWordFill = styled.span<{
  $progress: number;
  $readColor: string;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: ${({ $progress }) =>
    `${Math.min(100, Math.max(0, $progress * 100))}%`};
  overflow: hidden;
  color: ${({ $readColor }) => $readColor};
  text-shadow: none;
  white-space: nowrap;
  pointer-events: none;
`;
export const EntryCue = styled.div`
  position: absolute;
  top: calc(100% + 0.98cqw);
  left: 50%;
  transform: translateX(-50%);
`;
export const EntryCueBar = styled.div`
  width: 12cqw;
  height: 0.5cqw;
  overflow: hidden;
  border-radius: 999px;
  background: var(--entry-cue-empty-color);
  box-shadow: 0 0.1rem 0.3rem rgb(0 0 0 / 45%);
`;
export const EntryCueBarFill = styled.div`
  width: 100%;
  height: 100%;
  border-radius: inherit;
  transform: scaleX(var(--entry-cue-progress));
  transform-origin: left center;
  background: var(--entry-cue-fill-color);
  will-change: transform;
`;
export const NextPhrase = styled.p`
  position: absolute;
  z-index: 1;
  left: 50%;
  width: 100%;
  margin: 0;
  transform-origin: center top;
  will-change: opacity, transform;
  font: inherit;
  line-height: inherit;
`;
export const PlayerError = styled.p`
  position: absolute;
  z-index: 3;
  right: 1rem;
  bottom: 0.8rem;
  left: 1rem;
  margin: 0;
  color: #ff9caf;
  text-align: center;
  font-size: 0.72rem;
`;
export const PlayerBar = styled.section`
  display: grid;
  grid-template-columns: minmax(9rem, 1fr) auto minmax(9rem, 1fr);
  min-height: 3.5rem;
  padding: 0.45rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  gap: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  @media (max-width: 780px) {
    grid-template-columns: 1fr auto;
  }
`;
export const PlayerSeek = styled.label`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
  input {
    min-width: 0;
    flex: 1;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;
export const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  button {
    display: grid;
    border: 0;
    place-items: center;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    cursor: pointer;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.45;
  }
  & button:nth-of-type(2) {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    color: #24142c;
    background: ${({ theme }) => theme.colors.accent};
  }
`;
export const PlayerTools = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  @media (max-width: 780px) {
    display: none;
  }
`;
export const TimelinePanel = styled.section`
  display: grid;
  min-height: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-rows: 2.8rem minmax(0, 1fr);
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 72%,
    transparent
  );
`;
export const TimelineToolbar = styled.div`
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  button {
    border: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    cursor: pointer;
  }
  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;
export const TimelineTrackHeader = styled.div`
  display: flex;
  height: 100%;
  padding: 0 0.7rem;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  button {
    display: grid;
    width: 1.65rem;
    height: 1.65rem;
    border-radius: 0.35rem;
    place-items: center;
    color: ${({ theme }) => theme.colors.accent};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 12%,
      transparent
    );
  }

  @media (max-width: 780px) {
    display: none;
  }
`;
export const TimelineToolbarMain = styled.div`
  display: flex;
  min-width: 0;
  padding: 0 0.9rem;
  align-items: center;
  justify-content: space-between;
`;
export const TimelineToolbarOptions = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
export const TimelineHint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.64rem;
  @media (max-width: 780px) {
    display: none;
  }
`;
export const TimelineFollowToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.64rem;
  white-space: nowrap;
  cursor: pointer;

  input {
    width: 0.85rem;
    height: 0.85rem;
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
  }
`;
export const TimelineTempoField = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.64rem;
  white-space: nowrap;

  input {
    box-sizing: border-box;
    width: 3.9rem;
    height: 1.7rem;
    padding: 0 0.38rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.32rem;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
`;
export const Timeline = styled.div`
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;
export const TimelineViewport = styled.div`
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 0.5rem 0.8rem 0.8rem 0;
`;
export const TimelineContent = styled.div`
  position: relative;
  display: grid;
  box-sizing: border-box;
  min-width: max(34rem, 100%);
  gap: 0.45rem;
`;
export const TimelineBeatGrid = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  pointer-events: none;
  transform: translateX(var(--timeline-grid-offset));
  background-image:
    linear-gradient(90deg, rgb(211 137 255 / 30%) 0 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 10%) 0 1px, transparent 1px);
  background-repeat: repeat-x;
  background-size:
    var(--timeline-bar-size) 100%,
    var(--timeline-beat-size) 100%;
`;
export const TimelineLabels = styled.div`
  z-index: 2;
  display: grid;
  min-height: 0;
  overflow: hidden;
  padding: 0.5rem 0.4rem 0.8rem;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  align-content: start;
  gap: 0.45rem;
  background: ${({ theme }) => theme.colors.surface};
  @media (max-width: 780px) {
    display: none;
  }
`;
export const TimelineLabel = styled.button<{ $selected: boolean }>`
  display: flex;
  height: 2.3rem;
  min-width: 0;
  padding: 0 0.55rem;
  border: 1px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.accent : "transparent"};
  border-radius: 0.3rem;
  align-items: center;
  gap: 0.45rem;
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.text : theme.colors.textMuted};
  background: ${({ $selected, theme }) =>
    $selected
      ? `color-mix(in srgb, ${theme.colors.accent} 14%, transparent)`
      : "transparent"};
  font: inherit;
  font-size: 0.68rem;
  text-align: left;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.accent};
  }
`;
export const TimelineLane = styled.div`
  position: relative;
  min-width: 0;
  height: 2.3rem;
  border-radius: 0.25rem;
  background: rgb(255 255 255 / 3%);
  user-select: none;
`;
export const TimelinePlayhead = styled.div`
  position: absolute;
  z-index: 4;
  top: -0.15rem;
  bottom: -0.15rem;
  width: 2px;
  border-radius: 2px;
  pointer-events: none;
  background: ${({ theme }) => theme.colors.accent};
  box-shadow: 0 0 0.55rem ${({ theme }) => theme.colors.accent};
  &::before {
    position: absolute;
    top: -0.2rem;
    left: 50%;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    transform: translateX(-50%);
    background: ${({ theme }) => theme.colors.accent};
    content: "";
  }
`;
export const TimelineClip = styled.button<{
  $selected: boolean;
  $tone: "subtitle" | "audio" | "background";
}>`
  position: absolute;
  top: 0.15rem;
  height: 2rem;
  overflow: hidden;
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.accent : "rgb(255 255 255 / 15%)")};
  border-radius: 0.25rem;
  color: #fff;
  background: ${({ $tone }) => ($tone === "audio" ? "linear-gradient(90deg,#176c55,#229879)" : $tone === "background" ? "linear-gradient(100deg,#283b6f,#80506f)" : "linear-gradient(100deg,#6b3b93,#9d53c9)")};
  box-shadow: ${({ $selected, theme }) => ($selected ? `0 0 0 1px ${theme.colors.accent}` : "none")};
  font: inherit;
  font-size: 0.63rem;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
`;
export const Inspector = styled.aside`
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  align-content: start;
  gap: 0;
  background: ${({ theme }) => theme.colors.surface};
  @media (max-width: 1150px) {
    display: none;
  }
`;
export const InspectorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
    font-size: 0.9rem;
  }
  button {
    border: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    cursor: pointer;
  }
`;
export const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  button {
    position: relative;
    height: 2.35rem;
    border: 0;
    border-bottom: 2px solid transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    font: inherit;
    font-size: 0.68rem;
    cursor: pointer;
  }

  button:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  button[data-active="true"] {
    border-bottom-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.text};
  }
`;
export const PropertyAccordions = styled.section`
  display: grid;
`;
export const PropertyAccordion = styled.details`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  summary {
    display: flex;
    min-height: 2.6rem;
    padding: 0 1rem;
    align-items: center;
    justify-content: space-between;
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: "⌄";
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 1rem;
    font-weight: 400;
    transition: transform 150ms ease;
  }

  &[open] summary::after {
    transform: rotate(180deg);
  }

  &[open] summary {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;
export const PropertyAccordionContent = styled.div`
  display: grid;
  padding: 0.8rem 1rem 1rem;
  gap: 0.8rem;
`;
export const AnimationPanel = styled.section`
  display: grid;
  gap: 0.8rem;
`;
export const AnimationDescription = styled.p`
  margin: 0;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: rgb(255 255 255 / 2%);
  font-size: 0.72rem;
  line-height: 1.45;
`;
export const MixerContent = styled.section`
  display: grid;
  padding: 1rem;
  gap: 1rem;
`;
export const MixerHeader = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
  line-height: 1.45;
`;
export const MixerChannel = styled.div`
  position: relative;
  display: grid;
  overflow: hidden;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  gap: 0.75rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.background} 72%,
    transparent
  );

  label {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.55rem;
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.74rem;
  }

  label svg {
    color: ${({ theme }) => theme.colors.accent};
  }

  output {
    color: ${({ theme }) => theme.colors.textMuted};
    font-variant-numeric: tabular-nums;
  }

  input {
    z-index: 1;
    width: 100%;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;
export const MixerMeter = styled.span`
  display: block;
  height: 0.2rem;
  max-width: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    #54d99b,
    ${({ theme }) => theme.colors.accent}
  );
  transition: width 80ms linear;
`;
export const Field = styled.label`
  display: grid;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  input,
  textarea,
  select {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.4rem;
    padding: 0.65rem;
    color: ${({ theme }) => theme.colors.text};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.background} 80%,
      transparent
    );
    font: inherit;
    font-size: 0.75rem;
    resize: vertical;
  }
  textarea {
    min-height: 3.5rem;
  }
  input[data-draggable-number="true"] {
    cursor: ns-resize;
  }
  input[data-draggable-number="true"]:focus {
    cursor: text;
  }

  select {
    padding-right: 2.5rem;
  }
`;
export const BackgroundAssetButton = styled.button`
  display: inline-flex;
  min-height: 2.5rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 45%, transparent);
  border-radius: 0.45rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  background: linear-gradient(
    135deg,
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 18%, transparent),
    color-mix(in srgb, ${({ theme }) => theme.colors.surface} 90%, transparent)
  );
  box-shadow: inset 0 1px rgb(255 255 255 / 8%);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 23%,
      ${({ theme }) => theme.colors.surface}
    );
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;
export const BackgroundAssetName = styled.span`
  overflow: hidden;
  padding: 0.1rem 0.15rem 0;
  color: ${({ theme }) => theme.colors.textMuted};
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.68rem;
`;
export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
`;
export const ColorField = styled(Field)`
  grid-column: 1 / -1;
`;
export const ColorFieldControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;

  button {
    flex: 0 0 auto;
    min-height: 2rem;
    padding: 0 0.45rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.35rem;
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    font: inherit;
    font-size: 0.62rem;
    cursor: pointer;
  }

  button:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;
export const ColorInputValue = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.4rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.background} 80%,
    transparent
  );

  input[type="text"] {
    width: 100%;
    min-width: 0;
    padding: 0.65rem;
    border: 0;
    border-radius: 0 0.4rem 0.4rem 0;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    font: inherit;
    font-size: 0.75rem;
    flex: 1;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  input[type="color"] {
    box-sizing: border-box;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 0;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.4rem;
    background: transparent;
    cursor: pointer;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 0;
      border-radius: 0.35rem 0 0 0.35rem;
    }
  }
`;
export const SectionTitle = styled.h3`
  margin: 0.1rem 0 0;
  padding-top: 0.85rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.75rem;
`;
export const InheritanceHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.64rem;
  line-height: 1.4;
`;
export const WordList = styled.div`
  display: grid;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.4rem;
`;
export const WordTimingRow = styled.div<{ $active: boolean }>`
  display: grid;
  padding: 0.48rem 0.6rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns: minmax(0, 1fr) 4.2rem 4.2rem;
  align-items: center;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ $active, theme }) =>
    $active
      ? `color-mix(in srgb,${theme.colors.accent} 20%,transparent)`
      : "transparent"};
  font-size: 0.68rem;

  button {
    overflow: hidden;
    padding: 0;
    border: 0;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    font: inherit;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 0.3rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.3rem;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    font: inherit;
    font-size: 0.64rem;
  }

  input[data-draggable-number="true"] {
    cursor: ns-resize;
  }

  input[data-draggable-number="true"]:focus {
    cursor: text;
  }
`;
export const PhraseActions = styled.div`
  display: flex;
  justify-content: flex-end;

  button {
    display: flex;
    min-height: 2.25rem;
    padding: 0 0.7rem;
    border: 1px solid rgb(255 91 117 / 38%);
    border-radius: 0.4rem;
    align-items: center;
    gap: 0.45rem;
    color: #ff8ca2;
    background: rgb(255 72 105 / 8%);
    font: inherit;
    font-size: 0.68rem;
    cursor: pointer;
  }

  button:hover {
    border-color: rgb(255 91 117 / 70%);
    background: rgb(255 72 105 / 15%);
  }

  kbd {
    margin-left: 0.2rem;
    padding: 0.12rem 0.3rem;
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 0.25rem;
    color: ${({ theme }) => theme.colors.textMuted};
    background: rgb(0 0 0 / 16%);
    font-size: 0.58rem;
  }
`;
export const TrackActions = styled(PhraseActions)`
  padding-top: 0.2rem;
`;
export const WordRow = styled.button<{ $active: boolean }>`
  display: flex;
  padding: 0.48rem 0.6rem;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ $active, theme }) => ($active ? `color-mix(in srgb,${theme.colors.accent} 20%,transparent)` : "transparent")};
  font: inherit;
  font-size: 0.68rem;
  text-align: left;
  cursor: pointer;
  span:first-of-type {
    color: ${({ theme }) => theme.colors.text};
  }
`;
export const InspectorEmpty = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.76rem;
`;
export const ActionButton = styled.button`
  display: flex;
  border: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;
`;
export const Time = styled.output`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;
