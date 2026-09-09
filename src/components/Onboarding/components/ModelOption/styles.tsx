import styled from "@emotion/styled";

export const Label = styled.label`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 72%,
    transparent
  );
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 55%,
      transparent
    );
    transform: translateY(-1px);
  }

  &:has(input:checked) {
    border-color: ${({ theme }) => theme.colors.accent};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 13%,
      ${({ theme }) => theme.colors.surface}
    );
    box-shadow: 0 0 0 1px rgb(220 141 255 / 10%);
  }
`;

export const Input = styled.input`
  accent-color: ${({ theme }) => theme.colors.accent};
`;

export const Name = styled.strong`
  font-weight: 700;
  font-size: 0.88rem;
`;

export const Description = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.76rem;
`;
