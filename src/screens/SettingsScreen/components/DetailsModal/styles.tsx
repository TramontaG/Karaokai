import styled from "@emotion/styled";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  padding: 2rem;
  place-items: center;
  background: rgb(4 5 13 / 68%);
  backdrop-filter: blur(5px);
`;

export const Dialog = styled.section`
  width: min(34rem, 100%);
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.85rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1.4rem 4rem rgb(0 0 0 / 45%);
`;

export const DialogHeader = styled.header`
  display: flex;
  min-height: 4rem;
  padding: 0 1.2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

export const CloseButton = styled.button`
  display: grid;
  width: 2rem;
  height: 2rem;
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

export const DialogBody = styled.div`
  padding: 1.15rem 1.2rem 1.3rem;
`;
