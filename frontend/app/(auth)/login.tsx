import { Redirect, useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { SplashLoading } from "../../src/components/SplashLoading";
import { TextInputField } from "../../src/components/TextInputField";
import { colors, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, session, isLoading } = useAuth();
  const [email, setEmail] = useState("cliente@foodsave.com");
  const [password, setPassword] = useState("123456");
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
    setIsSubmitting(true);

    try {
      const nextSession = await login(email, password);
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
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.logoBlock}>
          <View style={styles.logoMark}>
            <Text style={styles.logoPrimary}>FOOD</Text>
            <Text style={styles.logoSecondary}>SAVE</Text>
          </View>
          <Text style={styles.tagline}>Rescatá comida buena cerca tuyo</Text>
        </View>

        <View style={styles.form}>
          <TextInputField
            autoCapitalize="none"
            icon={<Mail color={colors.mutedText} size={18} />}
            keyboardType="email-address"
            label="CORREO ELECTRÓNICO"
            onChangeText={setEmail}
            placeholder="cliente@foodsave.com"
            value={email}
          />
          <TextInputField
            icon={<Lock color={colors.mutedText} size={18} />}
            label="CONTRASEÑA"
            onChangeText={setPassword}
            placeholder="123456"
            secureTextEntry
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            isLoading={isSubmitting}
            label="INGRESAR"
            onPress={handleLogin}
          />

          <View style={styles.demoRow}>
            <DemoButton
              label="Cliente demo"
              onPress={() => {
                setEmail("cliente@foodsave.com");
                setPassword("123456");
              }}
            />
            <DemoButton
              label="Comercio demo"
              onPress={() => {
                setEmail("comercio@foodsave.com");
                setPassword("123456");
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function DemoButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.demoButton}>
      <Text style={styles.demoButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  demoButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  demoButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center"
  },
  demoRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: -spacing.xs
  },
  form: {
    gap: spacing.md,
    width: "100%"
  },
  keyboard: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center"
  },
  logoBlock: {
    alignItems: "center",
    gap: spacing.md
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  logoPrimary: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  logoSecondary: {
    color: colors.secondary,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  tagline: {
    color: colors.mutedText,
    fontSize: 15,
    textAlign: "center"
  }
});
