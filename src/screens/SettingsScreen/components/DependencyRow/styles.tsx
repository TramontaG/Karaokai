import styled from "@emotion/styled";

export const Row = styled.div`
  position: relative;
  display: grid;
  min-height: 3.15rem;
  padding: 0 0.8rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns:
    minmax(12rem, 1.5fr) minmax(7rem, 0.8fr) minmax(5rem, 0.65fr)
    minmax(7rem, 0.8fr) minmax(5rem, 0.6fr) 3.4rem minmax(6rem, 0.7fr);
  align-items: center;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const ComponentName = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.76rem;
`;

export const IconBox = styled.span`
  display: grid;
  width: 1.7rem;
  height: 1.7rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Status = styled.span`
  display: flex;
  align-items: center;
  gap: 0.48rem;
  color: #8c91a8;

  &[data-installed="true"] {
    color: #55cd8a;
  }
`;

export const StatusDot = styled.span`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: currentColor;
`;

export const Meta = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Actions = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

export const MenuButton = styled.button`
  display: grid;
  width: 2.8rem;
  height: 2rem;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.45rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 76%,
    transparent
  );
  cursor: pointer;

  &:hover,
  &[aria-expanded="true"] {
    color: ${({ theme }) => theme.colors.text};
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 40%,
      transparent
    );
  }
`;

export const InstallButton = styled.button`
  display: inline-flex;
  min-height: 2rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.45rem;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.background};
  background: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  white-space: nowrap;

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;

export const UpdateStatus = styled.span`
  justify-self: end;
  text-decoration: underline;
  text-underline-offset: 0.16rem;

  &[data-verified="true"] {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
