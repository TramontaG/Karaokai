import styled from "@emotion/styled";
export const Container = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
`;
export const Label = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 700;
`;
