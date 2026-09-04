import styled from "@emotion/styled";

export const Card = styled.article`
  position: relative;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 86%,
    transparent
  );
  box-shadow: 0 0.65rem 1.6rem rgb(0 0 0 / 8%);
  transition:
    border-color 150ms ease,
    transform 150ms ease;

  &:hover {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 45%,
      transparent
    );
    transform: translateY(-1px);
  }
`;

export const CardBody = styled.div`
  position: relative;
  min-height: 5.6rem;
  padding: 0.7rem 2.35rem 0.75rem 0.72rem;
`;

export const ProjectTitle = styled.h3`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.77rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectArtist = styled.p`
  overflow: hidden;
  margin: 0.28rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectUpdated = styled.p`
  overflow: hidden;
  margin: 0.72rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.63rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Actions = styled.div`
  position: absolute;
  top: 0.55rem;
  right: 0.42rem;
`;

export const MenuButton = styled.button`
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: 0.38rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover,
  &[aria-expanded="true"] {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }
`;

export const FavoriteButton = styled.button<{ $active: boolean }>`
  position: absolute;
  right: 0.65rem;
  bottom: 0.55rem;
  display: grid;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 0;
  place-items: center;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;
