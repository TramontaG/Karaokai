import styled from "@emotion/styled";

export const ProgressBody = styled.section`
  display: grid;
  margin: 2rem 0;
  gap: 0.7rem;

  small {
    color: #ff9caf;
    font-size: 0.78rem;
    line-height: 1.45;
  }
`;

export const ProgressValue = styled.output`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
`;

export const ProgressBar = styled.div<{ $progress: number }>`
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.border};

  &::before {
    display: block;
    width: ${({ $progress }) => `${Math.max(0, Math.min(100, $progress))}%`};
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #bd65f2, #dc8dff);
    content: "";
    transition: width 100ms linear;
  }
`;
