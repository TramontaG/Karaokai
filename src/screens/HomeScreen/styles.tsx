import styled from "@emotion/styled";
export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(3rem, 8vw, 5.5rem);
`;
export const Description = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.2rem;
`;
