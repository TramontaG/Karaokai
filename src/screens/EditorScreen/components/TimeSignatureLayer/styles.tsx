import styled from "@emotion/styled";
export const Placement = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  cursor: crosshair;
`;
export const Preview = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  pointer-events: none;
  background: ${({ theme }) => theme.colors.accent};
  span {
    position: absolute;
    top: 0;
    padding: 0.2rem;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.background};
    font-size: 0.7rem;
  }
`;
export const Hint = styled.div`
  position: sticky;
  left: 0;
  top: 0;
  width: fit-content;
  max-width: calc(100vw - 12rem);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0.3rem;
  font-size: 0.7rem;
  pointer-events: none;
  transform: translateY(2rem);
  button {
    pointer-events: auto;
    cursor: pointer;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.25rem;
  }
`;
