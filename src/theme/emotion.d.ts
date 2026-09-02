import "@emotion/react";
import type { AppTheme } from ".";

declare module "@emotion/react" {
  export interface Theme extends AppTheme {}
}
