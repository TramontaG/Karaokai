import styled from "@emotion/styled";

export const Mark = styled.span<{ $size: number }>`
  display: inline-flex;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  filter: drop-shadow(0 0 0.75rem rgb(214 118 255 / 22%));
`;

export const Bar = styled.span`
  width: 12%;
  height: 32%;
  border-radius: 999px;
  background: linear-gradient(180deg, #e49aff 0%, #b85cff 100%);

  &:nth-of-type(2),
  &:nth-of-type(4) {
    height: 64%;
  }

  &:nth-of-type(3) {
    height: 100%;
  }
`;
