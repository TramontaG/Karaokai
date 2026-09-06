import styled from "@emotion/styled";

export const Editor = styled.section`
  padding: 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.45rem;
  background: rgb(255 255 255 / 2%);
`;

export const CurveCanvas = styled.svg`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.35rem;
  background: ${({ theme }) => theme.colors.background};
  touch-action: none;
  user-select: none;
`;

export const GridLine = styled.line`
  stroke: ${({ theme }) => theme.colors.border};
  stroke-width: 0.7;
  vector-effect: non-scaling-stroke;
`;

export const Diagonal = styled.line`
  stroke: ${({ theme }) => theme.colors.textMuted};
  stroke-width: 0.7;
  stroke-dasharray: 2.2 2.2;
  opacity: 0.35;
  vector-effect: non-scaling-stroke;
`;

export const ControlArm = styled.line`
  stroke: ${({ theme }) => theme.colors.accent};
  stroke-width: 1.1;
  opacity: 0.8;
  vector-effect: non-scaling-stroke;
`;

export const Curve = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme.colors.text};
  stroke-width: 2;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
`;

export const AnchorPoint = styled.circle`
  fill: ${({ theme }) => theme.colors.text};
  pointer-events: none;
`;

export const ControlPoint = styled.circle`
  fill: ${({ theme }) => theme.colors.accent};
  stroke: transparent;
  stroke-width: 5;
  cursor: grab;
  outline: none;
  paint-order: stroke;

  &:hover {
    filter: brightness(1.15);
  }

  &:focus-visible {
    stroke: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 35%,
      transparent
    );
  }

  &:active {
    cursor: grabbing;
  }
`;
