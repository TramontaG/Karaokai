import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const Row = styled.div`
  display: grid;
  min-height: 2.65rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns:
    minmax(13rem, 1.5fr) minmax(7rem, 0.8fr) minmax(7rem, 0.7fr)
    minmax(5rem, 0.6fr) minmax(12rem, 1fr);
  align-items: center;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
`;

export const ModelName = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.text};

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Status = styled.span`
  display: flex;
  align-items: center;
  gap: 0.48rem;
  color: #8c91a8;

  &[data-installed="true"] {
    color: #55cd8a;
  }

  &[data-downloading="true"] {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const StatusDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
`;

export const Meta = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ActionArea = styled.div`
  display: grid;
  grid-template-columns: 2.8rem 9rem;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
`;

export const MenuWrap = styled.div`
  position: relative;
  grid-column: 1;
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
`;

export const DefaultBadge = styled.span`
  display: grid;
  width: 9rem;
  min-height: 2rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: 0.42rem;
  grid-column: 2;
  place-items: center;
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
`;

export const SetDefaultButton = styled.button`
  width: 9rem;
  min-height: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.42rem;
  grid-column: 2;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 0.66rem;
`;

export const DownloadButton = styled.button`
  width: 9rem;
  min-height: 2rem;
  border: 0;
  border-radius: 0.42rem;
  grid-column: 2;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2, #dc8dff 50%, #c96df5);
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 650;
`;

export const InstallProgress = styled.div`
  position: relative;
  display: grid;
  width: 9rem;
  min-height: 2.8rem;
  padding: 0.55rem 0.75rem 0.72rem;
  border: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 35%, transparent);
  border-radius: 0.48rem;
  grid-column: 2;
  overflow: hidden;
  place-items: center;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.accent} 8%,
    ${({ theme }) => theme.colors.surface}
  );
`;

export const ProgressLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.68rem;
  font-weight: 650;
  white-space: nowrap;

  svg {
    color: ${({ theme }) => theme.colors.accent};
    animation: ${spin} 0.9s linear infinite;
  }
`;

export const ProgressTrack = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 0.28rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.textMuted} 16%,
    transparent
  );
`;

export const ProgressFill = styled.span<{ $progress: number }>`
  display: block;
  width: ${({ $progress }) => `${$progress}%`};
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ae54ed, #e08aff);
  box-shadow: 0 0 0.65rem
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 55%, transparent);
  transition: width 240ms ease-out;
`;
