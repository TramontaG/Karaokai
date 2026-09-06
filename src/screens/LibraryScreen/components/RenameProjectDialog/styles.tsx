import styled from "@emotion/styled";

export const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  padding: 1rem;
  place-items: center;
  background: rgb(0 0 0 / 58%);
`;

export const Dialog = styled.form`
  display: grid;
  width: min(25rem, 100%);
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  gap: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1.25rem 3rem rgb(0 0 0 / 35%);

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.76rem;
  }

  input {
    min-height: 2.5rem;
    padding: 0 0.7rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    outline: none;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    font: inherit;
  }
`;

export const Actions = styled.div`
  display: flex;
  margin-top: 0.3rem;
  justify-content: flex-end;
  gap: 0.55rem;

  button {
    min-height: 2.25rem;
    padding: 0 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.45rem;
    color: ${({ theme }) => theme.colors.text};
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 0.76rem;
  }

  button[type="submit"] {
    border-color: transparent;
    color: #261333;
    background: linear-gradient(115deg, #bd65f2, #dc8dff);
    font-weight: 700;
  }
`;
