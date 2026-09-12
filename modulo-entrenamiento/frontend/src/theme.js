export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');";

export const LIGHT_THEME = {
  bg: "#F4F3F1",
  ink: "#16161A",
  inkSoft: "#87868C",
  line: "#E4E2DE",
  lineStrong: "#D2CFC9",
  accent: "#DD6B27",
  accentSoft: "#FBE9DC",
  up: "#1E9E4A",
  down: "#D6362B",
  card: "#FFFFFF",
  segment: "#EDEBE7",
};

export const DARK_THEME = {
  bg: "#0B0B0D",
  ink: "#F2F2F0",
  inkSoft: "#8E8E93",
  line: "#242427",
  lineStrong: "#38383B",
  accent: "#FF8A4C",
  accentSoft: "#3A2A1E",
  up: "#34C759",
  down: "#FF453A",
  card: "#19191C",
  segment: "#221F1E",
};

export const COLORS = { ...LIGHT_THEME };

export function applyTheme(isDark) {
  Object.assign(COLORS, isDark ? DARK_THEME : LIGHT_THEME);
}
