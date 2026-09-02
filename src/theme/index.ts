export type ThemeName = "light" | "dark";
export type ThemePreference = "system" | ThemeName;

export interface AppTheme {
  name: ThemeName;
  colors: Record<
    "background" | "surface" | "text" | "textMuted" | "accent" | "border",
    string
  >;
}

export const themes: Record<ThemeName, AppTheme> = {
  dark: {
    name: "dark",
    colors: {
      background: "#11111b",
      surface: "#181825",
      text: "#f7f5ff",
      textMuted: "#c9c5dd",
      accent: "#e9a8ff",
      border: "rgb(255 255 255 / 10%)",
    },
  },
  light: {
    name: "light",
    colors: {
      background: "#fbf9ff",
      surface: "#fff",
      text: "#272337",
      textMuted: "#625d73",
      accent: "#9333ea",
      border: "rgb(39 35 55 / 12%)",
    },
  },
};
