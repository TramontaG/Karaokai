import styled from "@emotion/styled";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  padding: 1.5rem;
  place-items: center;
  background: rgb(4 5 13 / 72%);
  backdrop-filter: blur(6px);
`;
export const Dialog = styled.section`
  box-sizing: border-box;
  width: min(60rem, 100%);
  max-height: calc(100vh - 3rem);
  overflow: auto;
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  background:
    radial-gradient(
      circle at top right,
      rgb(150 74 235 / 10%),
      transparent 32%
    ),
    ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1.4rem 4rem rgb(0 0 0 / 48%);

  &[data-progress] {
    width: min(32rem, 100%);
  }

  @media (max-width: 640px) {
    padding: 1.25rem;
    border-radius: 1rem;
  }
`;
export const DialogHeader = styled.header`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
`;
export const DialogIcon = styled.span`
  display: grid;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.85rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.accent};
  background: linear-gradient(
    135deg,
    rgb(190 101 242 / 18%),
    rgb(154 76 232 / 8%)
  );

  &[data-rendering="true"] svg {
    animation: export-dialog-spin 0.9s linear infinite;
  }

  @keyframes export-dialog-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
export const HeaderCopy = styled.div`
  min-width: 0;
`;
export const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1.7rem;
  line-height: 1.2;
`;
export const DialogSubtitle = styled.p`
  margin: 0.3rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.95rem;
`;
export const CloseButton = styled.button`
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
`;
export const FieldIcon = styled.span`
  display: grid;
  width: 2rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.text};
`;
export const Field = styled.label`
  display: grid;
  min-width: 0;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  select,
  input[type="number"] {
    box-sizing: border-box;
    width: 100%;
    min-height: 4rem;
    padding: 0 2.8rem 0 1rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.8rem;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    font: inherit;
    font-size: 0.95rem;
  }
  select {
    cursor: pointer;
  }
  input[type="range"] {
    width: 100%;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.78rem;
    line-height: 1.35;
  }
`;
export const GeneralOptions = styled.div`
  display: grid;
  margin: 2rem 0;
  gap: 1rem;

  .export-general-field {
    grid-template-columns: 2rem minmax(8rem, 10rem) minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
  }

  .export-general-field > span:first-of-type {
    grid-column: 1;
  }

  .export-general-field > span:nth-of-type(2) {
    grid-column: 2;
  }

  .export-general-field select {
    grid-column: 3;
  }

  @media (max-width: 640px) {
    .export-general-field {
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: 0.6rem;
    }

    .export-general-field > span:nth-of-type(2),
    .export-general-field select {
      grid-column: 2;
    }
  }
`;
export const Mixer = styled.section`
  display: grid;
  margin-bottom: 1.75rem;
  padding: 1.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  gap: 1.25rem;
  background: rgb(255 255 255 / 2%);

  .export-mixer-control > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
  }

  output {
    min-width: 2.5rem;
    color: ${({ theme }) => theme.colors.text};
    text-align: right;
  }
`;
export const SectionHeader = styled.h3`
  display: flex;
  margin: 0;
  align-items: center;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;
export const AdvancedOptions = styled.section`
  display: grid;
  padding: 1.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  background: rgb(255 255 255 / 2%);

  .export-advanced-title {
    grid-column: 1 / -1;
  }

  .export-advanced-field select {
    min-height: 3.45rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
export const Actions = styled.footer`
  display: flex;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  justify-content: flex-end;
  gap: 0.8rem;
`;
const Button = styled.button`
  display: flex;
  min-height: 3.5rem;
  padding: 0 1.25rem;
  border-radius: 0.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
`;
export const CancelButton = styled(Button)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  background: transparent;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;
export const PrimaryButton = styled(Button)`
  border: 0;
  color: #261333;
  background: linear-gradient(115deg, #bd65f2, #dc8dff);
  font-weight: 700;
`;
