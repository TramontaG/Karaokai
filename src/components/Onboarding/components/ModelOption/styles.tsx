import styled from "@emotion/styled";

export const Label = styled.label`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

export const Input = styled.input`
  accent-color: ${({ theme }) => theme.colors.accent};
`;

export const Name = styled.strong`
  font-weight: 700;
`;

export const Description = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;
