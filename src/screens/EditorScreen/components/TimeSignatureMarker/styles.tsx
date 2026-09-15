import styled from "@emotion/styled";
export const Marker = styled.div`
  position: absolute;
  z-index: 6;
  top: 0;
  bottom: 0;
  width: 2px;
  pointer-events: none;
  background: ${({ theme }) => theme.colors.accent};
`;
export const Actions = styled.div<{ $alignEnd: boolean }>`
  position: absolute;
  top: 0;
  transform: ${({ $alignEnd }) => ($alignEnd ? "translateX(-100%)" : "none")};
  display: flex;
  pointer-events: auto;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0.25rem;
  overflow: hidden;
  button {
    padding: 0.15rem 0.25rem;
    display: flex;
    align-items: center;
    border: 0;
    font: inherit;
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
    cursor: pointer;
    white-space: nowrap;
  }
  button:first-of-type {
    cursor: ew-resize;
    touch-action: none;
  }
  button:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;
export const EditPopover = styled.div`
  position: fixed;
  margin: 0;
  padding: 0.75rem;
  box-sizing: border-box;
  width: min(260px, calc(100vw - 16px));
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  pointer-events: auto;
  max-height: calc(100vh - 16px);
  overflow: auto;
  &:popover-open {
    display: grid;
    gap: 0.6rem;
  }
`;
