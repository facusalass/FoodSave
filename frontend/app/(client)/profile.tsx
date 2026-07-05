import { useRouter } from "expo-router";
import { Info, Moon, Sun } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { TextInputField } from "../../src/components/TextInputField";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getClientProfile,
  updateClientProfile
} from "../../src/services/clientProfileService";

type FieldErrors = Partial<Record<"name" | "phone", string>>;

export default function ClientProfileScreen() {
  const router = useRouter();
  const { logout, session, updateSessionUser } = useAuth();
  const { setThemeMode, theme, themeMode } = useTheme();
  const styles = createStyles(theme);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!session) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setProfileError(null);
        setIsLoadingProfile(true);
        const user = await getClientProfile(session.token);

        if (!isMounted) {
          return;
        }

        setName(user.name ?? "");
        setPhone(user.phone ?? "");
        setEmail(user.email ?? "");
        setCity(user.city ?? "");
        setAddress(user.address ?? "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setName(session.user.name ?? "");
        setPhone(session.user.phone ?? "");
        setEmail(session.user.email ?? "");
        setCity(session.user.city ?? "");
        setAddress(session.user.address ?? "");
        setProfileError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar tu perfil."
        );
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  async function handleSave() {
    if (!session || isSaving) {
      return;
    }

    const nextErrors = validateProfile({ name, phone });
    setFieldErrors(nextErrors);
    setSaveMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setProfileError(null);
      setIsSaving(true);
      const user = await updateClientProfile(session.token, {
        address: address.trim(),
        city: city.trim(),
        name: name.trim(),
        phone: phone.trim()
      });

      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setEmail(user.email ?? "");
      setCity(user.city ?? "");
      setAddress(user.address ?? "");
      await updateSessionUser(user);
      setSaveMessage("Datos guardados correctamente.");
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar los cambios."
      );
    } finally {
      setIsSaving(false);
    }
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
            onPress={() => {
              void setThemeMode("light");
            }}
            style={[
              styles.segmentButton,
              themeMode === "light" ? styles.activeSegment : null
            ]}
          >
            <Sun
              color={themeMode === "light" ? theme.inverseText : theme.mutedText}
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
            onPress={() => {
              void setThemeMode("dark");
            }}
            style={[
              styles.segmentButton,
              themeMode === "dark" ? styles.activeSegment : null
            ]}
          >
            <Moon
              color={themeMode === "dark" ? theme.inverseText : theme.mutedText}
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
        <Info color={theme.secondaryDark} size={20} />
        <Text style={styles.infoText}>
          Para poder reservar en los locales, necesitamos tus datos de contacto
          por unica vez.
        </Text>
      </View>

      <View style={styles.formCard}>
        {isLoadingProfile ? (
          <Text style={styles.statusText}>Cargando datos...</Text>
        ) : null}
        <TextInputField
          autoCapitalize="words"
          editable={!isSaving && !isLoadingProfile}
          error={fieldErrors.name}
          label="Nombre y Apellido"
          onChangeText={(value) => {
            setName(value);
            setFieldErrors((current) => ({ ...current, name: undefined }));
            setSaveMessage(null);
          }}
          placeholder="Ej: Juan Perez"
          value={name}
        />
        <TextInputField
          editable={!isSaving && !isLoadingProfile}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
          label="Telefono (WhatsApp)"
          onChangeText={(value) => {
            setPhone(value);
            setFieldErrors((current) => ({ ...current, phone: undefined }));
            setSaveMessage(null);
          }}
          placeholder="Ej: +54 9 362 1234567"
          textContentType="telephoneNumber"
          value={phone}
        />
        <TextInputField
          editable={false}
          keyboardType="email-address"
          label="Correo electronico"
          placeholder="tu@email.com"
          style={styles.readOnlyInput}
          value={email}
        />
      </View>

      <View style={styles.formCard}>
        <TextInputField
          autoCapitalize="words"
          editable={!isSaving && !isLoadingProfile}
          label="Ciudad"
          onChangeText={(value) => {
            setCity(value);
            setSaveMessage(null);
          }}
          placeholder="Ej: Resistencia, Chaco"
          value={city}
        />
        <TextInputField
          autoCapitalize="words"
          editable={!isSaving && !isLoadingProfile}
          label="Direccion (Calle y Altura)"
          onChangeText={(value) => {
            setAddress(value);
            setSaveMessage(null);
          }}
          placeholder="Ej: Av. San Martin 123"
          value={address}
        />
      </View>

      {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
      {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}

      <PrimaryButton
        disabled={isLoadingProfile}
        isLoading={isSaving}
        label="GUARDAR CAMBIOS"
        onPress={handleSave}
      />

      <PrimaryButton
        label="CERRAR SESION"
        onPress={handleLogout}
        variant="outline"
      />
    </ScreenContainer>
  );
}

function validateProfile(values: { name: string; phone: string }) {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Ingresa tu nombre y apellido.";
  }

  if (values.phone.trim() && !/^[+()\d\s-]{6,30}$/.test(values.phone.trim())) {
    errors.phone = "Ingresa un telefono valido.";
  }

  return errors;
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  activeSegment: {
    backgroundColor: theme.primary
  },
  activeSegmentText: {
    color: theme.inverseText
  },
  card: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  cardDescription: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  cardTextBlock: {
    flex: 1,
    gap: spacing.xs
  },
  cardTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  formCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  infoBox: {
    alignItems: "flex-start",
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}66`,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  infoText: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  },
  readOnlyInput: {
    color: theme.mutedText
  },
  segmented: {
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
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
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  statusText: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  successText: {
    color: theme.secondaryDark,
    fontSize: 13,
    fontWeight: "800"
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase"
  }
  });
}
