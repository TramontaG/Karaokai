import styled from "@emotion/styled";
export const Container = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};

  > section {
    width: min(90vw, 36rem);
    text-align: center;
  }
`;
export const Label = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 700;
`;
export const Detail = styled.p`
  margin: 0.65rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;
export const ErrorDetails = styled.p`
  margin: 0.8rem 0 0;
  overflow-wrap: anywhere;
  color: #ff839a;
  font-size: 0.8rem;
  line-height: 1.45;
`;
export const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.65rem 0.9rem;
  border: 0;
  border-radius: 0.5rem;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2, #dc8dff);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;
export const Progress = styled.progress`
  width: 100%;
  height: 0.35rem;
  margin-top: 1rem;
  accent-color: ${({ theme }) => theme.colors.accent};
`;
