import styled from "@emotion/styled";
import {
  Marker as BaseMarker,
  Actions as BaseActions,
} from "../TimeSignatureMarker/styles";
export { EditPopover } from "../TimeSignatureMarker/styles";
export const Marker = styled(BaseMarker)`
  background: ${({ theme }) => theme.colors.textMuted};
`;
export const Actions = styled(BaseActions)`
  top: 1.6rem;
  border-color: ${({ theme }) => theme.colors.textMuted};
`;
