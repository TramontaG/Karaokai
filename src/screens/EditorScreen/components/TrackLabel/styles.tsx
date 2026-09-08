import styled from "@emotion/styled";
import type { AppTheme } from "../../../../theme";

const labelStyles = ({
  $selected,
  theme,
}: {
  $selected: boolean;
  theme: AppTheme;
}) => `
  border: 1px solid ${$selected ? theme.colors.accent : "transparent"};
  color: ${$selected ? theme.colors.text : theme.colors.textMuted};
  background: ${
    $selected
      ? `color-mix(in srgb, ${theme.colors.accent} 14%, transparent)`
      : "transparent"
  };
`;

export const LabelButton = styled.button<{ $selected: boolean }>`
  display: flex;
  width: 100%;
  height: 2.3rem;
  min-width: 0;
  padding: 0 0.55rem;
  border-radius: 0.3rem;
  align-items: center;
  gap: 0.45rem;
  font: inherit;
  font-size: 0.68rem;
  text-align: left;
  cursor: pointer;
  ${({ $selected, theme }) => labelStyles({ $selected, theme })}

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const LabelEditor = styled.div<{ $selected: boolean }>`
  display: flex;
  width: 100%;
  height: 2.3rem;
  min-width: 0;
  padding: 0 0.55rem;
  border-radius: 0.3rem;
  align-items: center;
  gap: 0.45rem;
  ${({ $selected, theme }) => labelStyles({ $selected, theme })}

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.accent};
  }
  input {
    width: 100%;
    min-width: 0;
    padding: 0.25rem 0.35rem;
    border: 1px solid ${({ theme }) => theme.colors.accent};
    border-radius: 0.25rem;
    outline: 0;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-size: 0.68rem;
  }
`;
