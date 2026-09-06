import styled from "@emotion/styled";

export const PreparationPage = styled.main`
  width: min(100%, 46rem);
  margin: 0 auto;
  padding: clamp(3rem, 12vh, 8rem) 1.5rem;
`;
export const Header = styled.header`
  text-align: center;
  h1 {
    margin: 0;
    font-size: clamp(1.7rem, 3vw, 2.35rem);
  }
`;
export const Description = styled.p`
  margin: 0.8rem auto 2rem;
  max-width: 36rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;
export const ProgressBar = styled.div`
  height: 0.5rem;
  overflow: hidden;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.border};
`;
export const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #bd65f2, #dc8dff);
  transition: width 300ms ease;
`;
export const ProgressLabel = styled.p`
  margin: 0.65rem 0 1.5rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
  font-size: 0.78rem;
`;
export const StageList = styled.section`
  display: grid;
  gap: 0.65rem;
`;
export const PreparationStage = styled.article<{ $status: string }>`
  display: flex;
  min-height: 4.75rem;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.7rem;
  align-items: center;
  gap: 0.9rem;
  background: ${({ theme }) => theme.colors.surface};
  > div {
    flex: 1;
    min-width: 0;
  }
  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  strong,
  span {
    display: block;
  }
  strong {
    font-size: 0.9rem;
  }
  span {
    margin-top: 0.25rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.76rem;
  }
  ${({ $status, theme }) =>
    $status === "running" &&
    `svg { color: ${theme.colors.accent}; animation: spin 1s linear infinite; }`}
  ${({ $status }) => $status === "completed" && "svg { color: #74e5a6; }"}
  ${({ $status }) => $status === "failed" && "svg { color: #ff839a; }"}
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
export const StageProgress = styled.div`
  width: 100%;
  height: 0.26rem;
  margin-top: 0.65rem;
  overflow: hidden;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.border};
`;
export const StageProgressFill = styled.div<{ $status: string }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $status, theme }) =>
    $status === "failed"
      ? "#ff839a"
      : $status === "completed"
        ? "#74e5a6"
        : theme.colors.accent};
  transition: width 350ms ease;
  ${({ $status }) =>
    $status === "running" &&
    "animation: progress-pulse 1.2s ease-in-out infinite;"}
  @keyframes progress-pulse {
    50% {
      opacity: 0.55;
    }
  }
`;
export const ActionButton = styled.button`
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.8rem 1.15rem;
  border: 0;
  border-radius: 0.55rem;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2, #dc8dff);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
`;
