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
  login as loginWithApi
} from "../services/authService";
import type { AuthSession } from "../types/auth";
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession
} from "../utils/sessionStorage";

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedSession = await loadStoredSession();

      if (!storedSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const user = await getMe(storedSession.token);
        const nextSession = { token: storedSession.token, user };
        await saveStoredSession(nextSession);

        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
        await clearStoredSession();
      } finally {
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
        await saveStoredSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      async logout() {
        await clearStoredSession();
        setSession(null);
      }
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
