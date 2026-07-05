import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MailCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/context/ThemeContext";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { email } = useLocalSearchParams<{ email?: string }>();
  const registeredEmail = Array.isArray(email) ? email[0] : email;

  return (
    <ScreenContainer contentStyle={styles.screen} includeBottomSafeArea>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={() => router.replace("/(auth)/login")}
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
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MailCheck color={theme.primary} size={28} />
          </View>

          <Text style={styles.title}>Revisá tu correo</Text>
          <Text style={styles.message}>
            Te enviamos un email para confirmar tu cuenta. Abrí el link desde
            tu correo para activar la cuenta.
          </Text>

          {registeredEmail ? (
            <Text style={styles.email}>{registeredEmail}</Text>
          ) : null}
        </View>

        <Text style={styles.secondaryText}>
          Después de confirmar tu cuenta, iniciá sesión con tu email y
          contraseña.
        </Text>

        <PrimaryButton
          label="VOLVER AL LOGIN"
          onPress={() => router.replace("/(auth)/login")}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace("/(auth)/register")}
        >
          <Text style={styles.registerLink}>USAR OTRO CORREO</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  card: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 30
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.xl
  },
  email: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  headerSpacer: {
    width: 44
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52
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
  message: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  registerLink: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center",
    textDecorationLine: "underline"
  },
  screen: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0
  },
  secondaryText: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center"
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
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
