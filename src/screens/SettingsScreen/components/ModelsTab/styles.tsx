import styled from "@emotion/styled";

export const Panel = styled.section`
  padding: 1.1rem 1.15rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 58%,
    transparent
  );
`;

export const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

export const PanelDescription = styled.p`
  margin: 0.35rem 0 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
`;

export const Group = styled.section`
  margin-top: 0.8rem;
  padding-left: 2.4rem;
`;

export const GroupHeader = styled.h3`
  display: flex;
  min-height: 2.55rem;
  margin: 0 0 0 -2.4rem;
  align-items: center;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.74rem;
  font-weight: 600;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const DetailsGrid = styled.div`
  display: grid;
`;

export const DetailRow = styled.div`
  display: grid;
  min-height: 2.65rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns: minmax(9rem, 0.8fr) minmax(0, 1.5fr);
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;

  strong {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
    text-overflow: ellipsis;
  }
`;

export const Backend = styled.div`
  display: grid;
  padding-top: 1rem;
  gap: 0.45rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.78rem;
    font-weight: 500;
  }
`;
