import styled from "@emotion/styled";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  padding: 1.5rem;
  place-items: center;
  background: rgb(4 5 13 / 72%);
  backdrop-filter: blur(5px);
`;

export const Dialog = styled.section`
  width: min(28rem, 100%);
  padding: 1.2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1.4rem 4rem rgb(0 0 0 / 48%);
`;

export const Header = styled.header`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
`;

export const Icon = styled.span`
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  place-items: center;
  color: #ff8ca2;
  background: rgb(255 72 105 / 12%);
`;

export const Title = styled.h2`
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

export const Description = styled.p`
  margin: 1rem 0 1.2rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.78rem;
  line-height: 1.55;
`;

export const Actions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
`;

const ActionButton = styled.button`
  display: flex;
  min-height: 2.35rem;
  padding: 0 0.85rem;
  border-radius: 0.42rem;
  align-items: center;
  gap: 0.45rem;
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
`;

export const CancelButton = styled(ActionButton)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
`;

export const ConfirmButton = styled(ActionButton)`
  border: 1px solid rgb(255 91 117 / 52%);
  color: #fff;
  background: #cf3655;

  &:hover {
    background: #df4161;
  }
`;
