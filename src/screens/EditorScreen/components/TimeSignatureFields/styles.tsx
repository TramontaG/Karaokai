import styled from "@emotion/styled";

export const Fields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 0.25rem;
  input[type="number"],
  button {
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    height: 2.1rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 0.82rem;
    text-align: center;
  }
  button {
    cursor: pointer;
  }
`;

export const Line = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Presets = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  button {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    min-width: 5rem;
    min-height: 2rem;
    padding: 0.25rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.4rem;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 0.7rem;
    cursor: pointer;
  }
  button[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.accent};
  }
`;

export const DenominatorButton = styled.button`
  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.accent};
  }
`;
