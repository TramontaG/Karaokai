import {
  defaultPreferences,
  getSystemTheme,
  loadUserPreferences,
  type UserPreferences,
} from "../config/userPreferences";
import { type ThemeName } from "../theme";
import { createContext } from ".";

export interface AppData extends Record<string, unknown> {
  isLoading: boolean;
  systemTheme: ThemeName;
  preferences: UserPreferences;
}
const initialData: AppData = {
  isLoading: true,
  systemTheme: "dark",
  preferences: defaultPreferences,
};

export const appContext = createContext(initialData, () => ({
  isLoading: false,
  systemTheme: getSystemTheme(),
  preferences: loadUserPreferences(),
}));
