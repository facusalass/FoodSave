export type ThemeMode = "light" | "dark";

export type AppColors = {
  background: string;
  card: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  text: string;
  mutedText: string;
  border: string;
  softBorder: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  header: string;
  input: string;
  elevatedCard: string;
  subtleSurface: string;
  overlay: string;
  inverseText: string;
  placeholder: string;
};

export const lightColors: AppColors = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  primary: "#FF6B35",
  primaryDark: "#E64A19",
  secondary: "#14B8A6",
  secondaryDark: "#0F766E",
  text: "#1F2937",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  softBorder: "#0000001A",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#14B8A6",
  info: "#6366F1",
  header: "#FFFFFF",
  input: "#FFFFFF",
  elevatedCard: "#FFFFFF",
  subtleSurface: "#F8FAFC",
  overlay: "#11182799",
  inverseText: "#FFFFFF",
  placeholder: "#94A3B8"
};

export const darkColors: AppColors = {
  background: "#0F1724",
  card: "#1B2433",
  primary: "#FF5A2E",
  primaryDark: "#FF6B35",
  secondary: "#00BFA6",
  secondaryDark: "#00BFA6",
  text: "#FFFFFF",
  mutedText: "#93A4B8",
  border: "#334155",
  softBorder: "#33415566",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#00BFA6",
  info: "#60A5FA",
  header: "#1B2433",
  input: "#111827",
  elevatedCard: "#203A5A",
  subtleSurface: "#172033",
  overlay: "#020617AA",
  inverseText: "#FFFFFF",
  placeholder: "#64748B"
};

export const themeColors: Record<ThemeMode, AppColors> = {
  dark: darkColors,
  light: lightColors
};

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16
};
