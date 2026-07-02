import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getMe,
  login as loginWithApi,
  loginWithGoogle as loginWithGoogleApi,
  register as registerWithApi
} from "../services/authService";
import type {
  AuthSession,
  RegisterCredentials,
  RegisterResult
} from "../types/auth";
import {
  clearStoredSession,
  isValidAuthSession,
  loadStoredSession,
  saveStoredSession
} from "../utils/sessionStorage";

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  loginWithGoogle: (idToken: string) => Promise<AuthSession>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const MIN_SPLASH_DURATION_MS = 1000;

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const minimumSplashDelay = wait(MIN_SPLASH_DURATION_MS);

    async function restoreSession() {
      try {
        const storedSession = await loadStoredSession();

        if (!storedSession) {
          return;
        }

        const user = await getMe(storedSession.token);
        const nextSession = { token: storedSession.token, user };

        if (!isValidAuthSession(nextSession)) {
          await clearStoredSession();
          return;
        }

        await saveStoredSession(nextSession);

        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
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
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      async login(email, password) {
        const nextSession = await loginWithApi({ email, password });

        if (!isValidAuthSession(nextSession)) {
          throw new Error("No pudimos iniciar sesión.");
        }

        await saveStoredSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      async loginWithGoogle(idToken) {
        const nextSession = await loginWithGoogleApi(idToken);

        if (!isValidAuthSession(nextSession)) {
          throw new Error("No pudimos iniciar sesion con Google.");
        }

        await saveStoredSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      async register(credentials) {
        const result = await registerWithApi(credentials);

        if (isEmailConfirmationRequired(result)) {
          return result;
        }

        if (!isValidAuthSession(result)) {
          throw new Error("No pudimos crear la cuenta.");
        }

        await saveStoredSession(result);
        setSession(result);
        return result;
      },
      async logout() {
        setSession(null);
        await clearStoredSession();
      }
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function isEmailConfirmationRequired(
  result: RegisterResult
): result is Extract<RegisterResult, { emailConfirmationRequired: true }> {
  return "emailConfirmationRequired" in result && result.emailConfirmationRequired;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
