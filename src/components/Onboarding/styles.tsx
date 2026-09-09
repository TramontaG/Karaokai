import styled from "@emotion/styled";

export const Wrapper = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: clamp(1rem, 4vw, 3rem);
  overflow: hidden;
  background:
    radial-gradient(
      circle at 12% 12%,
      color-mix(
        in srgb,
        ${({ theme }) => theme.colors.accent} 14%,
        transparent
      ),
      transparent 25rem
    ),
    radial-gradient(
      circle at 88% 88%,
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 8%, transparent),
      transparent 28rem
    ),
    ${({ theme }) => theme.colors.background};
`;

export const Header = styled.header`
  position: fixed;
  z-index: 1;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  min-width: 0;
  min-height: 4.6rem;
  padding: 1rem 1.35rem;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  user-select: none;
  -webkit-app-region: drag;
`;

export const HeaderThemeButton = styled.button`
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  place-items: center;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 82%,
    transparent
  );
  cursor: pointer;
  -webkit-app-region: no-drag;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
  }
`;

export const WindowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  -webkit-app-region: no-drag;
`;

export const WindowAction = styled.button`
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }

  &:last-child:hover {
    color: #fff;
    background: #d53f50;
  }
`;

export const Card = styled.section`
  display: grid;
  width: min(100%, 42rem);
  gap: 1rem;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  border: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.border} 78%, #fff 12%);
  border-radius: 1rem;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 94%,
    transparent
  );
  box-shadow:
    0 1.5rem 4.5rem rgb(0 0 0 / 28%),
    inset 0 1px 0 rgb(255 255 255 / 5%);

  @media (max-width: 540px) {
    gap: 0.85rem;
    border-radius: 0.8rem;
  }
`;

export const Title = styled.h1`
  max-width: 16ch;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1.65rem, 3.6vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
  text-wrap: balance;
`;

export const Subtitle = styled.p`
  max-width: 62ch;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: clamp(0.84rem, 1.5vw, 0.96rem);
  line-height: 1.55;
  overflow-wrap: anywhere;

  + & {
    margin-top: -0.35rem;
    padding: 0.65rem 0.75rem;
    border-left: 2px solid
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 70%, transparent);
    border-radius: 0 0.4rem 0.4rem 0;
    color: ${({ theme }) => theme.colors.text};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 7%,
      transparent
    );
    font-family: "KaraokAI Mono", monospace;
    font-size: 0.78rem;
  }
`;

export const Action = styled.button`
  min-height: 2.75rem;
  width: max-content;
  max-width: 100%;
  margin-top: 0.35rem;
  padding: 0.72rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.6rem;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2, #dc8dff);
  box-shadow: 0 0.5rem 1.25rem rgb(190 91 242 / 20%);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 160ms ease,
    filter 160ms ease,
    border-color 160ms ease;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    filter: saturate(0.45);
    opacity: 0.62;
  }

  + & {
    margin-top: -0.35rem;
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.border};
    background: transparent;
    box-shadow: none;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;

  button {
    margin: 0;
  }

  @media (max-width: 540px) {
    display: grid;
    grid-template-columns: 1fr;

    button {
      width: 100%;
    }
  }
`;

export const StorageTransition = styled.div`
  display: flex;
  min-height: 4.15rem;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 36%, transparent);
  border-radius: 0.65rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.accent} 9%,
    transparent
  );

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 0.88rem;
  }

  span {
    margin-top: 0.12rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.78rem;
    line-height: 1.4;
  }
`;

export const StorageSpinner = styled.span`
  width: 1.55rem;
  height: 1.55rem;
  flex: 0 0 auto;
  border: 0.17rem solid
    color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
  border-top-color: ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  animation: onboarding-storage-spin 760ms linear infinite;

  @keyframes onboarding-storage-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Progress = styled.div`
  height: 0.55rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 4%);
  border-radius: 99px;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.border} 75%,
    #000
  );
`;

export const ProgressBar = styled.div<{ progress: number }>`
  width: ${({ progress }) => progress}%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #bd65f2, #f0adff);
  box-shadow: 0 0 0.8rem rgb(220 141 255 / 60%);
  transition: width 220ms ease-out;
`;

export const ModelList = styled.div`
  display: grid;
  max-height: min(38vh, 21rem);
  gap: 0.55rem;
  padding: 0.15rem;
  overflow: auto;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid rgb(255 131 154 / 30%);
  border-radius: 0.55rem;
  color: #ffb1bf;
  background: rgb(255 131 154 / 8%);
  font-size: 0.82rem;
  line-height: 1.45;
`;
