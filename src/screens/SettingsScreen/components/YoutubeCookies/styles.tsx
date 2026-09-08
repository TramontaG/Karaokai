import styled from "@emotion/styled";

export const CookiesCard = styled.section`
  display: grid;
  max-width: 46rem;
  margin-top: 0.35rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  gap: 0.65rem;
`;

export const CookiesCopy = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  color: ${({ theme }) => theme.colors.accent};

  div {
    display: grid;
    gap: 0.2rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.78rem;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.68rem;
    line-height: 1.45;
  }
`;

export const CookiesInput = styled.textarea`
  min-height: 8rem;
  padding: 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  resize: vertical;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  font:
    0.64rem/1.45 ui-monospace,
    "Cascadia Code",
    monospace;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.66rem;

  &[data-configured="true"] {
    color: #64b997;
  }

  &[data-error="true"] {
    color: #ff7787;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

export const ActionButton = styled.button`
  min-height: 2.2rem;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0.45rem;
  color: #fff;
  background: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &[data-secondary="true"] {
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    border-color: ${({ theme }) => theme.colors.border};
  }
`;
