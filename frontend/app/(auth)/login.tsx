import { Redirect, useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { SplashLoading } from "../../src/components/SplashLoading";
import { TextInputField } from "../../src/components/TextInputField";
import {
  googleAuthConfig,
  hasGoogleClientId
} from "../../src/config/googleAuth";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  // Router permite navegar despues de iniciar sesion.
  const router = useRouter();
  // Traemos acciones y estado global de auth desde AuthContext.
  const { login, loginWithGoogle, session, isLoading } = useAuth();
  const { isDark, theme } = useTheme();
  const styles = createStyles(theme, isDark);
  // Estados del formulario de email y password.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Errores visibles debajo de los inputs o del formulario.
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Loadings separados para login normal y login con Google.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  // Prepara el flujo de Google y devuelve la respuesta cuando el usuario termina.
  const [googleRequest, googleResponse, promptGoogleAuth] =
    Google.useIdTokenAuthRequest({
      androidClientId: googleAuthConfig.androidClientId,
      clientId: googleAuthConfig.clientId,
      iosClientId: googleAuthConfig.iosClientId,
      selectAccount: true,
      webClientId: googleAuthConfig.webClientId
    });

  useEffect(() => {
    async function finishGoogleLogin() {
      // Si Google todavia no respondio, no hacemos nada.
      if (!googleResponse) {
        return;
      }

      // Si el usuario cancela o falla Google, apagamos el loading.
      if (googleResponse.type !== "success") {
        setIsGoogleSubmitting(false);
        return;
      }

      // Google devuelve un idToken; nuestro backend lo valida despues.
      const idToken = googleResponse.params.id_token;

      if (!idToken) {
        setError("No pudimos obtener la credencial de Google.");
        setIsGoogleSubmitting(false);
        return;
      }

      try {
        // AuthContext manda el idToken al backend y guarda la sesion recibida.
        const nextSession = await loginWithGoogle(idToken);
        // Redirigimos segun el rol que vino en la sesion.
        router.replace(getHomeRoute(nextSession.user.role));
      } catch (googleError) {
        const message =
          googleError instanceof Error
            ? googleError.message
            : "No pudimos iniciar sesion con Google.";
        setError(message);
      } finally {
        setIsGoogleSubmitting(false);
      }
    }
  // Llamamos a finishGoogleLogin cada vez que googleResponse cambia.
    void finishGoogleLogin();
  }, [googleResponse, loginWithGoogle, router]);

  // Mientras AuthContext restaura sesion, mostramos splash.
  if (isLoading) {
    return <SplashLoading />;
  }

  // Si ya hay sesion, no dejamos al usuario en la pantalla de login.
  if (session?.user.role === "client") {
    return <Redirect href="/(client)/home" />;
  }

  if (session?.user.role === "business") {
    return <Redirect href="/(business)/dashboard" />;
  }

  // Flujo de login, sin google.
  async function handleLogin() {
    // Limpiamos errores anteriores antes de validar de nuevo.
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // Normalizamos y validamos campos antes de llamar al backend.
    const nextEmail = email.trim();
    const nextEmailError = getEmailError(nextEmail);
    const nextPasswordError = password ? null : "Ingresá tu contraseña.";

    //Solo se setea si hay un error, si no queda null
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    // Si el formulario esta incompleto, cortamos aca.
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsSubmitting(true);

    //Intenta loguear
    try {
      // AuthContext hace el login, valida la sesion y la guarda.
      const nextSession = await login(nextEmail, password);
      // Despues del login, entramos al home correspondiente al rol.
      router.replace(getHomeRoute(nextSession.user.role));
      //Si algo fallo dentro del try
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : "No pudimos iniciar sesión.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    // Limpiamos errores antes de iniciar el flujo externo de Google.
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // Si faltan client IDs, Google Login no puede arrancar.
    if (!hasGoogleClientId()) {
      setError("Google Login no esta configurado en la app.");
      return;
    }

    // googleRequest puede tardar un poco en prepararse.
    if (!googleRequest) {
      setError("Google Login todavia se esta preparando. Intenta de nuevo.");
      return;
    }

    setIsGoogleSubmitting(true);
    // Abre el flujo de Google; la respuesta se procesa en el useEffect.
    const result = await promptGoogleAuth();

    // Si no fue exitoso, no habra sesion para guardar.
    if (result.type !== "success") {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <ScreenContainer
      contentStyle={styles.screen}
      includeBottomSafeArea
      scroll={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandPrimary}>FOOD</Text>
            <Text style={styles.brandAccent}>SAVE</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>¡COMPLETÁ TU PERFIL!</Text>
            <Text style={styles.profileText}>
              Iniciá sesión o registrate para poder{"\n"}reservar en los locales.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isGoogleSubmitting || isSubmitting}
            onPress={handleGoogleLogin}
            style={[
              styles.googleButton,
              isGoogleSubmitting || isSubmitting ? styles.disabled : null
            ]}
          >
            <View style={styles.googleLogo}>
              <GoogleLogo />
            </View>
            {isGoogleSubmitting ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <Text style={styles.googleText}>CONTINUAR CON GOOGLE</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O USÁ TU CORREO</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInputField
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            error={emailError}
            keyboardType="email-address"
            onChangeText={(value) => {
              setEmail(value);
              setEmailError(null);
              setError(null);
            }}
            placeholder="CORREO ELECTRÓNICO"
            textContentType="emailAddress"
            value={email}
          />
          <TextInputField
            error={passwordError}
            onChangeText={(value) => {
              setPassword(value);
              setPasswordError(null);
              setError(null);
            }}
            placeholder="CONTRASEÑA"
            secureTextEntry
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isSubmitting}
            onPress={handleLogin}
            style={[styles.loginButton, isSubmitting ? styles.disabled : null]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.inverseText} />
            ) : (
              <Text style={styles.loginButtonText}>INGRESAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.createAccount}>CREAR CUENTA NUEVA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotPassword}>OLVIDÉ MI CONTRASEÑA</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function getEmailError(email: string) {
  if (!email) {
    return "Ingresá tu correo electrónico.";
  }

  if (!isValidEmail(email)) {
    return "Ingresá un correo electrónico válido.";
  }

  return null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getHomeRoute(role: "client" | "business") {
  return role === "business" ? "/(business)/dashboard" : "/(client)/home";
}

function GoogleLogo() {
  return (
    <Svg height={22} viewBox="0 0 48 48" width={22}>
      <Path
        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3.1l6-6C34.4 4.7 29.5 2.5 24 2.5 12.1 2.5 2.5 12.1 2.5 24S12.1 45.5 24 45.5c11 0 21-8 21-21.5 0-1.5-.2-2.8-.5-4z"
        fill="#FFC107"
      />
      <Path
        d="M5.8 14.1l7 5.1C14.7 14.5 19 11 24 11c3.1 0 5.9 1.1 8.1 3.1l6-6C34.4 4.7 29.5 2.5 24 2.5c-7.8 0-14.6 4.4-18.2 11.6z"
        fill="#FF3D00"
      />
      <Path
        d="M24 45.5c5.4 0 10.2-1.8 13.9-5.1l-6.4-5.4C29.5 36.3 26.9 37 24 37c-6 0-10.6-3-12.4-7.5l-7 5.4C8 41.4 15.4 45.5 24 45.5z"
        fill="#4CAF50"
      />
      <Path
        d="M44.5 20H24v8.5h11.8c-.5 2.5-2 4.8-4.3 6.5l6.4 5.4C41.6 37 45 31.5 45 24c0-1.5-.2-2.8-.5-4z"
        fill="#1976D2"
      />
    </Svg>
  );
}

function createStyles(theme: AppColors, isDark: boolean) {
  return StyleSheet.create({
  brandAccent: {
    color: theme.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0
  },
  brandPrimary: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg
  },
  createAccount: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.sm,
    textAlign: "center",
    textDecorationLine: "underline"
  },
  forgotPassword: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "800",
    marginTop: -spacing.xs,
    textAlign: "center",
    textDecorationLine: "underline"
  },
  disabled: {
    opacity: 0.64
  },
  dividerLine: {
    backgroundColor: theme.border,
    flex: 1,
    height: 1
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginVertical: spacing.sm
  },
  dividerText: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "600"
  },
  error: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: -spacing.xs,
    textAlign: "center"
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: spacing.sm,
    height: 54,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5
  },
  googleLogo: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: theme.border,
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  googleText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0
  },
  keyboard: {
    flex: 1
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: isDark ? theme.primary : "#1F2937",
    borderRadius: radii.md,
    height: 54,
    justifyContent: "center"
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 26
  },
  profileText: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  profileTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  screen: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0
  },
  topBar: {
    alignItems: "center",
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 68,
    justifyContent: "center",
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg
  }
  });
}
