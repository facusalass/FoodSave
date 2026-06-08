import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthSession } from "../types/auth";

const SESSION_KEY = "foodsave.session";

export async function loadStoredSession(): Promise<AuthSession | null> {
  const rawSession = await readValue();

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function saveStoredSession(session: AuthSession) {
  await writeValue(JSON.stringify(session));
}

export async function clearStoredSession() {
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function readValue() {
  if (Platform.OS === "web" && globalThis.localStorage) {
    return globalThis.localStorage.getItem(SESSION_KEY);
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeValue(value: string) {
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}
