import styled from "@emotion/styled";

export const Wrapper = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
`;

export const Card = styled.section`
  display: grid;
  width: min(100%, 38rem);
  gap: 1.25rem;
  padding: clamp(2rem, 7vw, 4rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.surface};
`;

export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(2.5rem, 8vw, 4.5rem);
`;

export const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

export const Action = styled.button`
  width: max-content;
  padding: 0.8rem 1.1rem;
  border: 0;
  border-radius: 0.5rem;
  color: #fff;
  background: ${({ theme }) => theme.colors.accent};
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const Progress = styled.div`
  height: 0.75rem;
  overflow: hidden;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.border};
`;

export const ProgressBar = styled.div<{ progress: number }>`
  width: ${({ progress }) => progress}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 120ms ease-out;
`;

export const ModelList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: #dc2626;
  line-height: 1.5;
`;
