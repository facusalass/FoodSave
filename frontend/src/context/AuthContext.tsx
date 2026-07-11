// Hooks y tipos de React que usamos para crear y consumir el contexto.
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
// Funciones que comunican este contexto con los endpoints de auth.
import {
  getMe,
  login as loginWithApi,
  loginWithGoogle as loginWithGoogleApi,
  register as registerWithApi
} from "../services/authService";
// Tipos de los datos que usa el flujo de autenticacion.
import type {
  AuthSession,
  RegisterCredentials,
  RegisterResult,
  User
} from "../types/auth";
// Funciones para persistir la sesion en SecureStore o localStorage.
import {
  clearStoredSession,
  isValidAuthSession,
  loadStoredSession,
  saveStoredSession
} from "../utils/sessionStorage";

// Define que datos y funciones podran usar las pantallas con useAuth().
type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  loginWithGoogle: (idToken: string) => Promise<AuthSession>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResult>;
  updateSessionUser: (user: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
};

// Contexto global; empieza en null hasta que AuthProvider envuelve la app.
const AuthContext = createContext<AuthContextValue | null>(null);
const MIN_SPLASH_DURATION_MS = 1000;

export function AuthProvider({ children }: PropsWithChildren) {
  // Guarda en memoria la sesion actual: token + user.
  const [session, setSession] = useState<AuthSession | null>(null);
  // Mientras carga, las pantallas esperan antes de redirigir.
  const [isLoading, setIsLoading] = useState(true);

  // Al abrir la app, intentamos recuperar una sesion anterior.
  useEffect(() => {
    // Evita actualizar estado si el componente se desmonto mientras esperaba la API.
    let isMounted = true;
    const minimumSplashDelay = wait(MIN_SPLASH_DURATION_MS);

    async function restoreSession() {
      try {
        // 1. Buscamos si habia una sesion guardada en el dispositivo.
        const storedSession = await loadStoredSession();

        if (!storedSession) {
          // Sin sesion local, la app terminara mostrando login.
          return;
        }

        // 2. Validamos el token contra el backend con GET /auth/me.
        const user = await getMe(storedSession.token);
        const nextSession = { token: storedSession.token, user };

        // 3. Si el backend no devuelve una sesion valida, limpiamos todo.
        if (!isValidAuthSession(nextSession)) {
          await clearStoredSession();
          return;
        }

        // 4. Guardamos la sesion confirmada y actualizamos el contexto.
        await saveStoredSession(nextSession);

        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
        // Si falla la restauracion, asumimos que la sesion ya no sirve.
        await clearStoredSession();
      } finally {
        await minimumSplashDelay;

        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      // Limpieza del useEffect cuando se desmonta el provider.
      isMounted = false;
    };
  }, []);

  // value es lo que AuthProvider le entrega a las pantallas que usan useAuth().
  // Incluye session, isLoading y funciones como login, register y logout.
  const value = useMemo<AuthContextValue>(() => {
    // Recibe una sesion valida: token + user.
    // La guarda localmente para futuras aperturas y en memoria para usarla ahora.
    async function persistSession(nextSession: AuthSession) {
      await saveStoredSession(nextSession);
      setSession(nextSession);
      return nextSession;
    }

    return {
      // Estas propiedades quedan disponibles en cualquier pantalla con useAuth().
      isLoading, //Mientras se restaura la sesion, las pantallas esperan antes de redirigir.
      session, //Contiene token y user, o null si no hay sesion.
      async login(email, password) {
        // Login normal: pedir sesion a la API, validarla y guardarla.
        return persistSession( //guardamos la session en memoria y en storage
          requireValidSession( //validamos la session
            await loginWithApi({ email, password }),
            "No pudimos iniciar sesión."
          )
        );
      },
      async loginWithGoogle(idToken) {
        // Login Google: el backend valida idToken y devuelve nuestra sesion.
        return persistSession(
          requireValidSession(
            await loginWithGoogleApi(idToken),
            "No pudimos iniciar sesion con Google."
          )
        );
      },
      // Registro: pedimos a la API crear un usuario, y si devuelve token + user, queda logueado automaticamente.
      async register(credentials) {
        const result = await registerWithApi(credentials);

        // Si Supabase pide confirmar email, todavia no guardamos sesion.
        if (isEmailConfirmationRequired(result)) {
          return result;
        }

        // Si la API devuelve token + user, validamos y guardamos la sesion.
        return persistSession(
          requireValidSession(result, "No pudimos crear la cuenta.")
        );
      },
      // Actualiza los datos del usuario en la sesion actual, manteniendo el token.
      async updateSessionUser(user) {
        if (!session) {
          // Sin sesion actual, no hay usuario local para actualizar.
          return;
        }

        // Creamos un nuevo objeto de sesion con los datos del usuario actualizados.
        const nextSession = {
          ...session,
          user: {
            ...session.user,
            ...user
          }
        };

        // Actualizamos storage y contexto con los nuevos datos del user.
        await persistSession(nextSession);
      },
      async logout() {
        // Logout borra la sesion en memoria y en almacenamiento local.
        setSession(null);
        await clearStoredSession();
      }
    };
  }, [isLoading, session]);

  // Entrega value a todas las pantallas envueltas por AuthProvider.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function isEmailConfirmationRequired(
  result: RegisterResult
): result is Extract<RegisterResult, { emailConfirmationRequired: true }> {
  // Distingue el registro pendiente de confirmacion de una sesion ya creada.
  return "emailConfirmationRequired" in result && result.emailConfirmationRequired;
}

function requireValidSession(
  nextSession: unknown,
  errorMessage: string
): AuthSession {
  // Protege al contexto de respuestas incompletas o inesperadas de la API.
  if (!isValidAuthSession(nextSession)) {
    throw new Error(errorMessage);
  }

  return nextSession;
}

function wait(milliseconds: number) {
  // Promise simple para respetar la duracion minima del splash.
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function useAuth() {
  // Hook que permite leer session, login, register y logout desde una pantalla.
  const value = useContext(AuthContext);

  if (!value) {
    // Protege contra usar useAuth fuera de AuthProvider.
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
