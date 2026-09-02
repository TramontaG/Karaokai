import styled from "@emotion/styled";
export const Header = styled.h1`
  color: ${({ theme }) => theme.colors.text};
`;
export const Card = styled.section`
  max-width: 30rem;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
`;
export const Meta = styled.p`
  color: ${({ theme }) => theme.colors.accent};
`;
export const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text};
`;
export const Description = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`;
export const Action = styled.button`
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  color: white;
  background: ${({ theme }) => theme.colors.accent};
  font: inherit;
  cursor: pointer;
`;
