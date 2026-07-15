import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthSession } from "../types/auth";

// Clave unica con la que la sesion se guarda en el dispositivo o en el navegador.
const SESSION_KEY = "foodsave.session";

// Lee la sesion guardada al abrir la app.
export async function loadStoredSession(): Promise<AuthSession | null> {
  const rawSession = await readValue();

  if (!rawSession) {
    return null;
  }

  try { 
    const session = JSON.parse(rawSession) as unknown;
// Validamos que el objeto tenga la forma minima de una sesion valida.
    if (!isValidAuthSession(session)) {
      await clearStoredSession();
      return null;
    }
// Si todo esta bien, devolvemos la sesion para que el usuario quede logueado.
    return session;
  } catch {
    await clearStoredSession();
    return null;
  }
}

// login o registro exitoso guardan la sesion en el dispositivo para mantener al usuario logueado.
export async function saveStoredSession(session: AuthSession) {
  // La sesion contiene el token y los datos basicos del usuario autenticado.
  await writeValue(JSON.stringify(session));
}

export async function clearStoredSession() {
  // Logout o una sesion invalida eliminan este dato para evitar reutilizar un token viejo.
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function readValue() {
  // En web se usa localStorage; en Android/iOS se usa SecureStore.
  if (Platform.OS === "web" && globalThis.localStorage) {
    return globalThis.localStorage.getItem(SESSION_KEY);
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeValue(value: string) {
  // Mantenemos la misma clave y estrategia de almacenamiento al guardar una sesion nueva.
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export function isValidAuthSession(session: unknown): session is AuthSession {
  // Esta validacion no verifica el token contra el backend.
  // Solo confirma que el objeto local tiene la forma minima esperada.
  if (typeof session !== "object" || session === null) {
    return false;
  }

  if (!("token" in session) || typeof session.token !== "string") {
    return false;
  }

  if (!session.token) {
    return false;
  }

  if (!("user" in session) || typeof session.user !== "object" || session.user === null) {
    return false;
  }

  const { user } = session;

  // El rol determina la redireccion inicial: Home para client o Dashboard para business.
  return (
    "id" in user &&
    typeof user.id === "string" &&
    "role" in user &&
    (user.role === "client" || user.role === "business")
  );
}
