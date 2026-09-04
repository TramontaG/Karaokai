import styled from "@emotion/styled";

export const Page = styled.div`
  width: 100%;
  min-width: 58rem;
  padding: 0.85rem 2rem 2rem;
`;

export const PageHeader = styled.header`
  margin-bottom: 1.4rem;
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.9rem;
  line-height: 1.1;
  letter-spacing: -0.025em;
`;

export const PageDescription = styled.p`
  margin: 0.55rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.82rem;
`;

export const Tabs = styled.nav`
  display: grid;
  min-height: 3.25rem;
  margin-bottom: 1.15rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns: repeat(6, minmax(7rem, 1fr));
`;

export const Tab = styled.button`
  position: relative;
  display: flex;
  padding: 0 0.75rem;
  border: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;

  &::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    border-radius: 999px;
    background: transparent;
    content: "";
  }

  &[data-active="true"] {
    color: ${({ theme }) => theme.colors.accent};
  }

  &[data-active="true"]::after {
    background: ${({ theme }) => theme.colors.accent};
  }
`;

export const Panel = styled.section`
  display: grid;
  gap: 0.9rem;
  padding: 1.2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 58%,
    transparent
  );
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

export const PanelDescription = styled.p`
  margin: -0.55rem 0 0.6rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.72rem;
`;

export const FormGrid = styled.div`
  display: grid;
  max-width: 28rem;
  gap: 1rem;
`;

export const Field = styled.div`
  display: grid;
  gap: 0.5rem;
`;

export const Label = styled.label`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.74rem;
`;

export const Select = styled.select`
  padding: 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
`;

export const Toggle = styled.input`
  accent-color: ${({ theme }) => theme.colors.accent};
`;

export const ToggleLabel = styled(Label)`
  width: fit-content;
  min-height: 2.5rem;
  cursor: pointer;
`;

export const StoragePath = styled.div`
  display: grid;
  max-width: 48rem;
  padding: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;

  strong {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
    text-overflow: ellipsis;
  }
`;

export const DangerZone = styled.section`
  display: grid;
  margin-top: 1rem;
  padding: 1rem 1.2rem;
  border: 1px solid rgb(255 73 94 / 35%);
  border-radius: 0.65rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  color: #ff6f82;
  background: rgb(255 52 77 / 6%);
`;

export const DangerCopy = styled.div`
  display: grid;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.76rem;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.68rem;
  }
`;

export const DangerButton = styled.button`
  min-height: 2.4rem;
  padding: 0 1rem;
  border: 1px solid rgb(255 91 111 / 15%);
  border-radius: 0.48rem;
  color: #ff7787;
  background: rgb(157 39 55 / 36%);
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
`;

export const AboutGrid = styled.div`
  display: grid;
  max-width: 35rem;
  grid-template-columns: 10rem 1fr;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.74rem;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;
