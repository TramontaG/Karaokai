import styled from "@emotion/styled";

export const TempoPopover = styled.div`
  position: fixed;
  box-sizing: border-box;
  margin: 0;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: 0 8px 28px rgb(0 0 0 / 25%);
  max-height: calc(100vh - 16px);
  overflow-y: auto;

  &:popover-open {
    display: grid;
    gap: 0.65rem;
  }

  label {
    justify-content: space-between;
  }

  input {
    width: 5.5rem;
  }
`;
