import styled from "@emotion/styled";

export const ImportShell = styled.section`
  width: min(100%, 49rem);
  margin: 2rem auto 0;
`;

export const DropArea = styled.label`
  display: flex;
  min-height: 19rem;
  padding: 2rem;
  border: 1px dashed ${({ theme }) => theme.colors.accent};
  border-radius: 0.75rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${({ theme }) => theme.colors.textMuted};
  background:
    radial-gradient(
      circle at 50% 45%,
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 6%, transparent),
      transparent 52%
    ),
    color-mix(in srgb, ${({ theme }) => theme.colors.surface} 46%, transparent);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease;

  &:hover,
  &:focus-within {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 76%,
      #fff
    );
    background-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 4%,
      transparent
    );
  }

  @media (max-width: 700px) {
    min-height: 13rem;
    padding: 1.5rem;
    text-align: center;
  }
`;

export const FileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const DropTitle = styled.h2`
  margin: 1.1rem 0 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.02rem;
  font-weight: 650;
`;

export const FormatText = styled.p`
  margin: 0.55rem 0 1.1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.78rem;
`;

export const ChooseFile = styled.span`
  display: inline-flex;
  min-width: 12rem;
  padding: 0.76rem 1rem;
  border-radius: 0.55rem;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2 0%, #dc8dff 48%, #c96df5 100%);
  box-shadow: 0 0.45rem 1.25rem rgb(190 91 242 / 18%);
  font-size: 0.78rem;
  font-weight: 650;
`;

export const Separator = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
  margin: 1.3rem 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
`;

export const SeparatorLine = styled.span`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

export const YoutubeForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 8.7rem;
  gap: 0.75rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const InputShell = styled.div`
  display: flex;
  min-width: 0;
  height: 3rem;
  padding: 0 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 72%,
    transparent
  );

  &:focus-within {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 55%,
      transparent
    );
  }
`;

export const YoutubeInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  font: inherit;
  font-size: 0.78rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const YoutubeButton = styled.button`
  border: 0;
  border-radius: 0.55rem;
  color: #21152b;
  background: linear-gradient(120deg, #bd65f2 0%, #dc8dff 52%, #c96df5 100%);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 650;

  &:hover {
    filter: brightness(1.06);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    min-height: 3rem;
  }
`;
