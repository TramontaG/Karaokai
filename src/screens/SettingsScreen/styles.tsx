import styled from "@emotion/styled";
export const Panel = styled.section`
  display: grid;
  gap: 1rem;
  max-width: 32rem;
  color: ${({ theme }) => theme.colors.text};
`;
export const Field = styled.div`
  display: grid;
  gap: 0.5rem;
`;
export const Label = styled.label`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
`;
export const Select = styled.select`
  padding: 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
`;
export const Toggle = styled.input`
  accent-color: ${({ theme }) => theme.colors.accent};
`;
