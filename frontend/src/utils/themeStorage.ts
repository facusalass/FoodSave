import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { ThemeMode } from "../constants/theme";

const THEME_MODE_KEY = "foodsave.themeMode";

export async function loadStoredThemeMode(): Promise<ThemeMode | null> {
  const storedThemeMode = await readValue();

  if (storedThemeMode === "light" || storedThemeMode === "dark") {
    return storedThemeMode;
  }

  if (storedThemeMode) {
    await clearStoredThemeMode();
  }

  return null;
}

export async function saveStoredThemeMode(themeMode: ThemeMode) {
  await writeValue(themeMode);
}

async function clearStoredThemeMode() {
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.removeItem(THEME_MODE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(THEME_MODE_KEY);
}

async function readValue() {
  if (Platform.OS === "web" && globalThis.localStorage) {
    return globalThis.localStorage.getItem(THEME_MODE_KEY);
  }

  return SecureStore.getItemAsync(THEME_MODE_KEY);
}

async function writeValue(value: string) {
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.setItem(THEME_MODE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(THEME_MODE_KEY, value);
}
