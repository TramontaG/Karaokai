import styled from "@emotion/styled";
export const Container = styled.section`
  display: grid;
  min-height: calc(100vh - 8rem);
  align-content: center;
`;
export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(2.5rem, 7vw, 4.5rem);
`;
export const Description = styled.p`
  max-width: 35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.1rem;
  line-height: 1.6;
`;
