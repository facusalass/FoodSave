import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  type AppColors,
  type ThemeMode,
  themeColors
} from "../constants/theme";
import {
  loadStoredThemeMode,
  saveStoredThemeMode
} from "../utils/themeStorage";

type ThemeContextValue = {
  theme: AppColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    let isMounted = true;

    async function restoreThemeMode() {
      const storedThemeMode = await loadStoredThemeMode();

      if (isMounted && storedThemeMode) {
        setThemeModeState(storedThemeMode);
      }
    }

    void restoreThemeMode();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (nextThemeMode: ThemeMode) => {
    setThemeModeState(nextThemeMode);
    await saveStoredThemeMode(nextThemeMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextThemeMode = themeMode === "dark" ? "light" : "dark";
    await setThemeMode(nextThemeMode);
  }, [setThemeMode, themeMode]);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = themeColors[themeMode];

    return {
      isDark: themeMode === "dark",
      setThemeMode,
      theme,
      themeMode,
      toggleTheme
    };
  }, [setThemeMode, themeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  }

  return value;
}
