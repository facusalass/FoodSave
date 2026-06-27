import { useRouter } from "expo-router";
import { Info, Moon, Sun } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";

export default function ClientProfileScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <ClientTopBar onMenuPress={() => setIsMenuVisible(true)} />
      <ClientSideMenu
        onClose={() => setIsMenuVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        visible={isMenuVisible}
      />

      <Text style={styles.title}>Completa tu perfil</Text>

      <View style={styles.card}>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>Tema de la aplicacion</Text>
          <Text style={styles.cardDescription}>
            Cambia entre modo claro y oscuro
          </Text>
        </View>
        <View style={styles.segmented}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setThemeMode("light")}
            style={[
              styles.segmentButton,
              themeMode === "light" ? styles.activeSegment : null
            ]}
          >
            <Sun
              color={themeMode === "light" ? colors.card : colors.mutedText}
              size={15}
            />
            <Text
              style={[
                styles.segmentText,
                themeMode === "light" ? styles.activeSegmentText : null
              ]}
            >
              Claro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setThemeMode("dark")}
            style={[
              styles.segmentButton,
              themeMode === "dark" ? styles.activeSegment : null
            ]}
          >
            <Moon
              color={themeMode === "dark" ? colors.card : colors.mutedText}
              size={15}
            />
            <Text
              style={[
                styles.segmentText,
                themeMode === "dark" ? styles.activeSegmentText : null
              ]}
            >
              Oscuro
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Info color={colors.secondaryDark} size={20} />
        <Text style={styles.infoText}>
          Para poder reservar en los locales, necesitamos tus datos de contacto
          por unica vez.
        </Text>
      </View>

      <View style={styles.formCard}>
        <ProfileField
          label="Nombre y Apellido"
          value={session?.user.name ?? "Ej: Juan Perez"}
        />
        <ProfileField
          label="Telefono (WhatsApp)"
          value={session?.user.phone ?? "Ej: +54 9 362 1234567"}
        />
        <ProfileField
          label="Correo electronico"
          value={session?.user.email ?? "Ej: juan@email.com"}
        />
      </View>

      <View style={styles.formCard}>
        <ProfileField label="Ciudad" value="Resistencia, Chaco" />
        <ProfileField
          label="Direccion (Calle y Altura)"
          value="Ej: Av. San Martin 123"
        />
      </View>

      <PrimaryButton
        label="CERRAR SESION"
        onPress={handleLogout}
        variant="outline"
      />
    </ScreenContainer>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeSegment: {
    backgroundColor: colors.primary
  },
  activeSegmentText: {
    color: colors.card
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  cardDescription: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  cardTextBlock: {
    flex: 1,
    gap: spacing.xs
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg
  },
  field: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  fieldLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "700"
  },
  fieldValue: {
    color: colors.mutedText,
    fontSize: 16
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  infoBox: {
    alignItems: "flex-start",
    backgroundColor: "#14B8A61A",
    borderColor: "#14B8A666",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  infoText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  },
  segmented: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 2
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  segmentText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
