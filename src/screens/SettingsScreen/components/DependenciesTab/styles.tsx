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

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

export const PanelDescription = styled.p`
  margin: 0.35rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
`;

export const CheckupButton = styled.button`
  display: inline-flex;
  min-height: 2.35rem;
  padding: 0 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.48rem;
  align-items: center;
  gap: 0.55rem;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 82%,
    transparent
  );
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;

  &[data-checking="true"] svg {
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const CheckupResult = styled.div`
  display: flex;
  min-height: 2.4rem;
  margin-top: 0.8rem;
  padding: 0 0.75rem;
  border: 1px solid rgb(83 205 138 / 25%);
  border-radius: 0.45rem;
  align-items: center;
  gap: 0.55rem;
  color: #55cd8a;
  background: rgb(83 205 138 / 6%);
  font-size: 0.68rem;

  &[data-variant="error"] {
    border-color: rgb(255 91 111 / 30%);
    color: #ff6f82;
    background: rgb(255 91 111 / 7%);
  }
`;

export const RuntimeList = styled.div`
  margin-top: 0.9rem;
`;

export const DetailsGrid = styled.div`
  display: grid;
`;

export const DetailsRow = styled.div`
  display: grid;
  min-height: 2.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns: minmax(9rem, 0.8fr) minmax(0, 1.5fr);
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;

  &:last-child {
    border-bottom: 0;
  }

  strong {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
    text-overflow: ellipsis;
  }
`;

export const DetailsStatus = styled.strong`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff6f82 !important;

  &[data-verified="true"] {
    color: #55cd8a !important;
  }
`;
