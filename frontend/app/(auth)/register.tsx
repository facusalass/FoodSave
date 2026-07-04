import { Redirect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
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
import { SplashLoading } from "../../src/components/SplashLoading";
import { TextInputField } from "../../src/components/TextInputField";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoading, register, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

  async function handleRegister() {
    setError(null);

    const nextValues = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      confirmPassword
    };
    const nextErrors = validateRegister(nextValues);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        email: nextValues.email,
        name: nextValues.name,
        password: nextValues.password,
        phone: nextValues.phone
      });

      if ("emailConfirmationRequired" in result) {
        router.replace({
          pathname: "/(auth)/check-email",
          params: { email: nextValues.email }
        });
        return;
      }

      router.replace("/(client)/home");
    } catch (registerError) {
      const message =
        registerError instanceof Error
          ? registerError.message
          : "No pudimos crear la cuenta.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined
    }));
    setError(null);
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
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
            <Text style={styles.title}>NUEVA CUENTA</Text>
            <Text style={styles.subtitle}>
              Completa tus datos para empezar a salvar comida en los locales.
            </Text>
          </View>

          <SectionTitle label="DATOS PERSONALES" />
          <TextInputField
            autoCapitalize="words"
            error={fieldErrors.name}
            onChangeText={(value) => {
              setName(value);
              clearFieldError("name");
            }}
            placeholder="NOMBRE Y APELLIDO"
            textContentType="name"
            value={name}
          />
          <TextInputField
            error={fieldErrors.phone}
            keyboardType="phone-pad"
            onChangeText={(value) => {
              setPhone(value);
              clearFieldError("phone");
            }}
            placeholder="TELEFONO (WHATSAPP)"
            textContentType="telephoneNumber"
            value={phone}
          />

          <SectionTitle label="CREDENCIALES" />
          <TextInputField
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            error={fieldErrors.email}
            keyboardType="email-address"
            onChangeText={(value) => {
              setEmail(value);
              clearFieldError("email");
            }}
            placeholder="CORREO ELECTRONICO"
            textContentType="emailAddress"
            value={email}
          />
          <TextInputField
            error={fieldErrors.password}
            onChangeText={(value) => {
              setPassword(value);
              clearFieldError("password");
            }}
            placeholder="CREAR CONTRASENA"
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          <TextInputField
            error={fieldErrors.confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldError("confirmPassword");
            }}
            placeholder="CONFIRMAR CONTRASENA"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            isLoading={isSubmitting}
            label="GUARDAR DATOS"
            onPress={handleRegister}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.loginLink}>YA TENGO UNA CUENTA. VOLVER.</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function SectionTitle({ label }: { label: string }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function validateRegister(values: {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const errors: FieldErrors = {};

  if (!values.name) {
    errors.name = "Ingresa tu nombre y apellido.";
  }

  if (!values.phone) {
    errors.phone = "Ingresa tu telefono de WhatsApp.";
  }

  if (!values.email) {
    errors.email = "Ingresa tu correo electronico.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo electronico valido.";
  }

  if (!values.password) {
    errors.password = "Crea una contrasena.";
  } else if (values.password.length < 6) {
    errors.password = "La contrasena debe tener al menos 6 caracteres.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirma tu contrasena.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
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
    fontWeight: "600",
    textAlign: "center"
  },
  headerSpacer: {
    width: 44
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
  sectionTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  subtitle: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 21,
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
