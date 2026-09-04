import styled from "@emotion/styled";

export const Menu = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 40;
  width: 15.5rem;
  padding: 0.45rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 96%,
    ${({ theme }) => theme.colors.background}
  );
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 38%);
`;

export const Item = styled.button`
  display: flex;
  width: 100%;
  min-height: 2.3rem;
  padding: 0 0.7rem;
  border: 0;
  border-radius: 0.42rem;
  align-items: center;
  gap: 0.7rem;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  text-align: left;

  &:hover,
  &:focus-visible {
    outline: 0;
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 12%,
      transparent
    );
  }

  &[data-variant="danger"] {
    color: #ff6f82;
  }
`;

export const Separator = styled.div`
  height: 1px;
  margin: 0.35rem -0.45rem;
  background: ${({ theme }) => theme.colors.border};
`;
