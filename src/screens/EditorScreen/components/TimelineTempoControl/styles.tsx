import styled from "@emotion/styled";

export const TempoPopover = styled.div`
  position: fixed;
  box-sizing: border-box;
  margin: 0;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  background: linear-gradient(
    145deg,
    ${({ theme }) => theme.colors.surface},
    ${({ theme }) => theme.colors.background}
  );
  color: ${({ theme }) => theme.colors.text};
  box-shadow: 0 0.75rem 1.75rem rgb(0 0 0 / 35%);
  max-height: calc(100vh - 16px);
  overflow-y: auto;

  &:popover-open {
    display: grid;
    gap: 0.65rem;
  }

  input:focus-visible,
  button:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

export const PopoverHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;

  strong {
    font-size: 0.9rem;
  }

  > button {
    display: grid;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: 0;
    place-items: center;
    color: ${({ theme }) => theme.colors.textMuted};
    background: transparent;
    cursor: pointer;
  }
`;

export const TempoFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;

  label {
    display: grid;
    gap: 0.25rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.68rem;
  }

  input[type="number"] {
    width: 100%;
    height: 2.1rem;
    padding: 0 0.5rem;
    border-radius: 0.45rem;
    font-size: 0.88rem;
  }
`;

export const MetronomeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.8rem;
  padding: 0.55rem 0 0.65rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  > svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.text};
  }

  input[type="range"] {
    flex: 1;
    min-width: 0;
    width: 100%;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const MetronomeToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  white-space: nowrap;
  cursor: pointer;

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const EventsLabel = styled.span`
  margin-bottom: -0.3rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  font-weight: 600;
`;

export const SectionTabs = styled.div<{
  $activeTab: "signature" | "tempo";
  $visible: boolean;
}>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.45rem;
  padding: 0.15rem;
  background: ${({ theme }) => theme.colors.background};

  &::before {
    position: absolute;
    z-index: 0;
    top: 0.15rem;
    bottom: 0.15rem;
    left: 0.15rem;
    width: calc(50% - 0.15rem);
    border-radius: 0.35rem;
    background: linear-gradient(115deg, #bd65f2, #dc8dff);
    content: "";
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $activeTab }) =>
      $activeTab === "tempo" ? "translateX(100%)" : "translateX(0)"};
    transition:
      transform 100ms ease-in-out,
      opacity 100ms ease-in-out;
  }

  && > button {
    position: relative;
    z-index: 1;
    min-height: 2rem;
    padding: 0.3rem;
    border: 0;
    border-radius: 0.35rem;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
  }

  && > button[aria-expanded="true"] {
    font-weight: 700;
  }
`;

export const SectionButton = styled.button<{ active: boolean }>`
  flex: 1;
`;

export const TabPanel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 10rem;
  padding-bottom: 2.2rem;
  gap: 0.65rem;
`;

export const TempoChangePanel = styled.div`
  display: flex;
  flex: 1;
  align-items: center;

  > label {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.45rem;
    font-size: 0.82rem;
  }

  > label input {
    width: 100%;
    height: 2.5rem;
    font-size: 1rem;
  }
`;

export const PrimaryButton = styled.button`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 2.2rem;
  padding: 0.4rem;
  border: 0;
  border-radius: 0.45rem;
  color: #261333;
  background: linear-gradient(115deg, #bd65f2, #dc8dff);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
