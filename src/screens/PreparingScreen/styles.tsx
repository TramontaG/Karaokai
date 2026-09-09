import styled from "@emotion/styled";

export const PreparationPage = styled.main`
  width: min(100%, 50rem);
  margin: 0 auto;
  padding: clamp(1.5rem, 4vh, 3rem) 1.5rem;
`;
export const Header = styled.header`
  text-align: center;
  h1 {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: clamp(1.45rem, 2.5vw, 2rem);
    line-height: 1.18;
  }
`;
export const Description = styled.p`
  margin: 0.6rem auto 1.15rem;
  max-width: 36rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.4;
`;
export const LyricsDialog = styled.section`
  width: min(100%, 38rem);
  margin: 1.5rem auto;
  padding: 1.25rem;
  border: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 45%, transparent);
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 0.85rem 2.5rem rgb(0 0 0 / 18%);

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  > p {
    margin: 0.55rem 0 1rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8rem;
    line-height: 1.4;
  }
`;
export const LyricsForm = styled.form`
  display: grid;
  gap: 0.75rem;

  label {
    display: grid;
    gap: 0.4rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.75rem;
  }
`;
export const LyricsTextArea = styled.textarea`
  width: 100%;
  padding: 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  resize: vertical;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 70%,
    #000
  );
  font: inherit;
  font-size: 0.78rem;
  line-height: 1.45;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    outline: none;
  }
`;
export const LyricsError = styled.p`
  margin: 0;
  color: #ff839a;
  font-size: 0.75rem;
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
  margin: 0.45rem 0 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
  font-size: 0.78rem;
`;
export const StageList = styled.section`
  display: grid;
  gap: 0.45rem;
`;
export const PreparationStage = styled.article<{ $status: string }>`
  display: flex;
  min-height: 3.85rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.7rem;
  align-items: center;
  gap: 0.7rem;
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
    font-size: 0.84rem;
  }
  span {
    margin-top: 0.15rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.7rem;
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
  height: 0.22rem;
  margin-top: 0.4rem;
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
  margin: 0.85rem auto 0;
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
export const LyricsActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;

  button {
    margin: 0;
  }

  button:last-child {
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  }
`;
