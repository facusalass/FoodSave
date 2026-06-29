import { Redirect, useRouter } from "expo-router";
import { Bell, Menu } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { SplashLoading } from "../../src/components/SplashLoading";
import { TextInputField } from "../../src/components/TextInputField";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, session, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <SplashLoading />;
  }

  if (session?.user.role === "client") {
    return <Redirect href="/(client)/home" />;
  }

  if (session?.user.role === "business") {
    return <Redirect href="/(business)/dashboard" />;
  }

  async function handleLogin() {
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    const nextEmail = email.trim();
    const nextEmailError = getEmailError(nextEmail);
    const nextPasswordError = password ? null : "Ingresá tu contraseña.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextSession = await login(nextEmail, password);
      const nextRoute =
        nextSession.user.role === "business"
          ? "/(business)/dashboard"
          : "/(client)/home";

      router.replace(nextRoute);
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

  return (
    <ScreenContainer contentStyle={styles.screen} scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.topBar}>
          <View style={styles.iconButton}>
            <Menu color={colors.text} size={24} />
          </View>

          <View style={styles.brandRow}>
            <Text style={styles.brandPrimary}>FOOD</Text>
            <Text style={styles.brandAccent}>SAVE</Text>
          </View>

          <View style={styles.iconButton}>
            <Bell color={colors.text} size={21} />
            <View style={styles.notificationDot} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>¡COMPLETÁ TU PERFIL!</Text>
            <Text style={styles.profileText}>
              Iniciá sesión o registrate para poder{"\n"}reservar en los locales.
            </Text>
          </View>

          <View style={styles.googleButton}>
            <View style={styles.googleLogo}>
              <Text style={styles.googleMark}>G</Text>
              <View style={[styles.googleAccent, styles.googleAccentRed]} />
              <View style={[styles.googleAccent, styles.googleAccentYellow]} />
              <View style={[styles.googleAccent, styles.googleAccentGreen]} />
            </View>
            <Text style={styles.googleText}>CONTINUAR CON GOOGLE</Text>
          </View>

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
              <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  brandAccent: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0
  },
  brandPrimary: {
    color: colors.text,
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
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.sm,
    textAlign: "center",
    textDecorationLine: "underline"
  },
  forgotPassword: {
    color: colors.mutedText,
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
    backgroundColor: colors.border,
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
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: -spacing.xs,
    textAlign: "center"
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    height: 50,
    justifyContent: "center"
  },
  googleAccent: {
    borderRadius: 2,
    height: 4,
    position: "absolute",
    width: 4
  },
  googleAccentGreen: {
    backgroundColor: "#34A853",
    bottom: 4,
    right: 5
  },
  googleAccentRed: {
    backgroundColor: "#EA4335",
    left: 5,
    top: 4
  },
  googleAccentYellow: {
    backgroundColor: "#FBBC05",
    bottom: 4,
    left: 7
  },
  googleLogo: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    position: "relative",
    width: 30
  },
  googleMark: {
    color: "#4285F4",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0
  },
  googleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0
  },
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    position: "relative",
    width: 40
  },
  keyboard: {
    flex: 1
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#1F2937",
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
  notificationDot: {
    backgroundColor: colors.secondary,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 9,
    top: 8,
    width: 9
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 26
  },
  profileText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  profileTitle: {
    color: colors.text,
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
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 68,
    justifyContent: "space-between",
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg
  }
});
