import styled from "@emotion/styled";

export const Dialog = styled.dialog`
  width: min(28rem, calc(100% - 2rem));
  padding: 1.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1.4rem 4rem rgb(0 0 0 / 48%);
  &::backdrop {
    background: rgb(4 5 13 / 72%);
  }
  h2 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }
  p {
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;
export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.3rem;
  button {
    min-height: 2.5rem;
    padding: 0 1rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    color: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  button[data-destructive="true"] {
    background: #cf3655;
    color: white;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;
export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.text};
  padding: 0.7rem;
  border: 1px solid #cf3655;
  border-radius: 0.4rem;
`;
