import styled from "@emotion/styled";

export const Row = styled.div`
  position: relative;
  display: grid;
  min-height: 3.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns:
    minmax(17rem, 2fr) minmax(9rem, 1.2fr) minmax(6rem, 0.7fr)
    minmax(8rem, 1fr) 3.6rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.71rem;

  &:hover {
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.surface} 44%,
      transparent
    );
  }
`;

export const NameCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.85rem;
`;

export const TitleLine = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.65rem;
`;

export const ProjectName = styled.strong`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectArtist = styled.span`
  overflow: hidden;
  padding-right: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectDuration = styled.span`
  white-space: nowrap;
`;

export const ProjectUpdated = styled.span`
  white-space: nowrap;
`;

export const FavoriteIcon = styled.button<{ $active: boolean }>`
  display: grid;
  width: 1.7rem;
  height: 1.7rem;
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

export const ActionsCell = styled.div`
  display: flex;
  justify-content: center;
`;

export const Actions = styled.div`
  position: relative;
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
