import styled from "@emotion/styled";

export const Clip = styled.button<{ $selected: boolean; $splitting: boolean }>`
  position: absolute;
  top: 0.12rem;
  height: 2.08rem;
  overflow: hidden;
  padding: 0;
  border: 1px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.accent : "rgb(255 255 255 / 18%)"};
  border-radius: 0.28rem;
  color: #fff;
  background: linear-gradient(100deg, #603383, #9149bd);
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `0 0 0 1px ${theme.colors.accent}` : "none"};
  font: inherit;
  cursor: ${({ $splitting }) => ($splitting ? "crosshair" : "grab")};
  touch-action: none;

  &:active:not([data-splitting="true"]) {
    cursor: grabbing;
  }
`;

export const Words = styled.span`
  position: absolute;
  inset: 0 0.35rem;
`;

export const WordSegment = styled.span<{
  $active: boolean;
  $selected: boolean;
  $splitting?: boolean;
  $gap: boolean;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  min-width: 1px;
  overflow: hidden;
  border-right: 1px solid rgb(255 255 255 / 24%);
  align-items: center;
  justify-content: center;
  color: ${({ $active }) => ($active ? "#fff" : "rgb(255 255 255 / 78%)")};
  background: ${({ $active, $selected, $gap, theme }) =>
    $gap
      ? "repeating-linear-gradient(135deg, rgb(255 255 255 / 18%) 0 2px, transparent 2px 5px)"
      : $selected
        ? `color-mix(in srgb, ${theme.colors.accent} 42%, transparent)`
        : $active
          ? "rgb(255 255 255 / 14%)"
          : "transparent"};
  cursor: ${({ $splitting }) => ($splitting ? "crosshair" : "pointer")};
  pointer-events: auto;
`;

export const WordLabel = styled.span`
  overflow: hidden;
  padding: 0 0.18rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.58rem;
  pointer-events: none;
`;

export const ClipEdge = styled.span<{
  $side: "start" | "end";
  $splitting: boolean;
}>`
  position: absolute;
  z-index: 6;
  top: 0;
  ${({ $side }) => ($side === "start" ? "left: 0;" : "right: 0;")}
  width: 0.45rem;
  height: 100%;
  background: rgb(255 255 255 / 12%);
  cursor: ${({ $splitting }) => ($splitting ? "crosshair" : "ew-resize")};
  touch-action: none;

  &::after {
    position: absolute;
    top: 25%;
    bottom: 25%;
    ${({ $side }) => ($side === "start" ? "left: 0.16rem;" : "right: 0.16rem;")}
    width: 1px;
    background: rgb(255 255 255 / 80%);
    content: "";
  }
`;

export const WordEdge = styled.span<{
  $side: "start" | "end";
  $visible: boolean;
  $splitting: boolean;
}>`
  position: absolute;
  z-index: 8;
  top: 0.18rem;
  bottom: 0.18rem;
  ${({ $side }) => ($side === "start" ? "left: -0.24rem;" : "right: -0.24rem;")}
  display: ${({ $visible }) => ($visible ? "block" : "none")};
  width: 0.48rem;
  border-inline: 2px solid ${({ theme }) => theme.colors.accent};
  background: rgb(18 12 29 / 65%);
  cursor: ${({ $splitting }) => ($splitting ? "crosshair" : "ew-resize")};
  touch-action: none;
`;
