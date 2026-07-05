import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { TextInputField } from "../../src/components/TextInputField";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { resetPassword } from "../../src/services/authService";

const SUCCESS_MESSAGE =
  "Te enviamos un email con instrucciones para recuperar tu contraseña.";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccessMessage(null);

    const nextEmail = email.trim();
    const nextEmailError = getEmailError(nextEmail);
    setEmailError(nextEmailError);

    if (nextEmailError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(nextEmail);
      setSuccessMessage(SUCCESS_MESSAGE);
    } catch (resetError) {
      const message =
        resetError instanceof Error
          ? resetError.message
          : "No pudimos enviar las instrucciones.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer contentStyle={styles.screen} includeBottomSafeArea>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Volver al login"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={theme.text} size={22} />
          </Pressable>

          <Text style={styles.logo}>
            FOOD<Text style={styles.logoAccent}>SAVE</Text>
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleCard}>
            <View style={styles.iconWrap}>
              <Mail color={theme.primary} size={25} />
            </View>
            <Text style={styles.title}>RECUPERAR CONTRASEÑA</Text>
            <Text style={styles.subtitle}>
              Ingresá tu correo y te vamos a enviar instrucciones para volver a
              entrar a tu cuenta.
            </Text>
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
              setSuccessMessage(null);
            }}
            placeholder="CORREO ELECTRÓNICO"
            textContentType="emailAddress"
            value={email}
          />

          {successMessage ? (
            <Text style={styles.success}>{successMessage}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            isLoading={isSubmitting}
            label="ENVIAR INSTRUCCIONES"
            onPress={handleSubmit}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.loginLink}>VOLVER A INICIAR SESIÓN</Text>
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

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg
  },
  error: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  headerSpacer: {
    width: 44
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  keyboard: {
    flex: 1
  },
  loginLink: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center",
    textDecorationLine: "underline"
  },
  logo: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3
  },
  logoAccent: {
    color: theme.primary
  },
  screen: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0
  },
  subtitle: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  success: {
    color: theme.secondaryDark,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center"
  },
  title: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  titleCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 28
  },
  topBar: {
    alignItems: "center",
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 68,
    justifyContent: "space-between",
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.md
  }
  });
}
