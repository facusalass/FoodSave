import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Moon,
  Pencil,
  Plus,
  Sun,
  Upload
} from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessSuspendedBanner } from "../../src/components/business/BusinessSuspendedBanner";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getBusinessOffers,
  getBusinessProfile,
  updateBusinessOfferVisibility,
  updateBusinessProfile,
  uploadImage
} from "../../src/services/offerService";
import type { Offer } from "../../src/types/offer";
import {
  formatClosingTimeDisplay,
  isValidClosingTime,
  maskClosingTimeInput,
  normalizeClosingTime
} from "../../src/utils/closingTime";
import { formatCurrency } from "../../src/utils/formatCurrency";

type StoreTab = "settings" | "publications";

const DEFAULT_CLOSING_TIME = "";
const DEFAULT_CATEGORY = "Panaderia / Pasteleria";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

export default function BusinessStoreScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { session } = useAuth();
  const { setThemeMode, theme, themeMode } = useTheme();
  const styles = createStyles(theme);
  const [activeTab, setActiveTab] = useState<StoreTab>("settings");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(
    null
  );

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [description, setDescription] = useState("");
  const [closingTime, setClosingTime] = useState(DEFAULT_CLOSING_TIME);
  const [holderName, setHolderName] = useState("");
  const [cvu, setCvu] = useState("");
  const [bankAlias, setBankAlias] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const loadProfile = useCallback(async () => {
    if (!session) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      setProfileError(null);
      setIsLoadingProfile(true);
      const business = await getBusinessProfile(session.token);
      setBusinessName(business.name ?? "");
      setCategory(business.category ?? DEFAULT_CATEGORY);
      setDescription(business.description ?? "");
      setClosingTime(normalizeClosingTime(business.closingTime) ?? DEFAULT_CLOSING_TIME);
      setLogoUrl(business.logoUrl ?? "");
      setHolderName(business.paymentInfo?.ownerName ?? "");
      setCvu(business.paymentInfo?.cvu ?? "");
      setBankAlias(business.paymentInfo?.alias ?? "");
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar los datos del local.";
      setProfileError(message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [session]);

  const loadOffers = useCallback(async () => {
    if (!session) {
      setIsLoadingOffers(false);
      return;
    }

    try {
      setOffersError(null);
      setIsLoadingOffers(true);
      const nextOffers = await getBusinessOffers(session.token);
      setOffers(nextOffers);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar las publicaciones.";
      setOffersError(message);
    } finally {
      setIsLoadingOffers(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (tab === "publications") {
        setActiveTab("publications");
      }

      void loadProfile();
      void loadOffers();
    }, [loadOffers, loadProfile, tab])
  );

  async function handleSave() {
    if (!session || isSaving) {
      return;
    }

    const cleanName = businessName.trim();
    const cleanCategory = category.trim();
    const cleanClosingTime = normalizeClosingTime(closingTime);
    const cleanHolderName = holderName.trim();
    const cleanCvu = cvu.trim();
    const cleanBankAlias = bankAlias.trim();

    if (!cleanName) {
      Alert.alert("Revisemos los datos", "El nombre del negocio es requerido.");
      return;
    }

    if (!cleanCategory) {
      Alert.alert("Revisemos los datos", "El rubro o categoria es requerido.");
      return;
    }

    if (!cleanClosingTime || !isValidClosingTime(cleanClosingTime)) {
      Alert.alert(
        "Revisemos el horario",
        "Carga un horario de cierre valido en formato HH:mm. Ejemplo: 22:00."
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateBusinessProfile(session.token, {
        category: cleanCategory,
        closingTime: cleanClosingTime,
        description: description.trim(),
        logoUrl: logoUrl.trim() || undefined,
        name: cleanName,
        paymentInfo: {
          alias: cleanBankAlias,
          cvu: cleanCvu,
          ownerName: cleanHolderName
        }
      });

      Alert.alert(
        "Cambios guardados",
        "Actualizamos los datos del local."
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar los cambios.";
      Alert.alert("No pudimos guardar", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoPress() {
    if (!session || isUploadingLogo) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galeria para elegir el logo del local."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ["images"],
        quality: 0.85
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets.at(0);
      if (!image) {
        return;
      }

      const mimeType = image.mimeType ?? inferMimeType(image.uri);
      const fileName = image.fileName ?? `logo-${Date.now()}.${getExtension(mimeType)}`;

      if (!isAllowedImageType(mimeType)) {
        Alert.alert("Formato no compatible", "Elegí una imagen JPG o PNG.");
        return;
      }

      if (image.fileSize && image.fileSize > MAX_LOGO_SIZE_BYTES) {
        Alert.alert("Imagen muy pesada", "El logo puede pesar hasta 2MB.");
        return;
      }

      setIsUploadingLogo(true);
      const uploadedUrl = await uploadImage(session.token, {
        name: fileName,
        type: mimeType,
        uri: image.uri
      });
      setLogoUrl(uploadedUrl);
      Alert.alert(
        "Logo cargado",
        "Ya lo subimos. Toca Guardar Cambios para dejarlo fijo en tu local."
      );
    } catch (logoError) {
      const message =
        logoError instanceof Error
          ? logoError.message
          : "No pudimos subir el logo.";
      Alert.alert("No pudimos cargar el logo", message);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleToggleVisibility(offer: Offer) {
    if (!session || visibilityLoadingId) {
      return;
    }

    const nextVisibility = offer.isVisible === false;

    try {
      setVisibilityLoadingId(offer.id);
      const updatedOffer = await updateBusinessOfferVisibility(
        session.token,
        offer.id,
        nextVisibility
      );

      setOffers((currentOffers) =>
        currentOffers.map((currentOffer) =>
          currentOffer.id === offer.id
            ? { ...currentOffer, ...updatedOffer }
            : currentOffer
        )
      );
    } catch (visibilityError) {
      const message =
        visibilityError instanceof Error
          ? visibilityError.message
          : "No pudimos actualizar la publicacion.";
      Alert.alert("No pudimos actualizar", message);
    } finally {
      setVisibilityLoadingId(null);
    }
  }

  const activeCount = offers.filter((offer) => offer.isVisible !== false).length;
  const hiddenCount = offers.filter((offer) => offer.isVisible === false).length;

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <BusinessMenuButton />
        <Text style={styles.topBarTitle}>Mi Local</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <BusinessSuspendedBanner />

      <View style={styles.tabsRow}>
        <StoreTabButton
          isActive={activeTab === "settings"}
          label="Datos y Config."
          onPress={() => setActiveTab("settings")}
        />
        <StoreTabButton
          isActive={activeTab === "publications"}
          label="Publicaciones"
          onPress={() => setActiveTab("publications")}
        />
      </View>

      {activeTab === "settings" && isLoadingProfile ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando datos del local...</Text>
        </View>
      ) : activeTab === "settings" && profileError && !businessName ? (
        <EmptyState title="No pudimos cargar el local" description={profileError} />
      ) : activeTab === "settings" ? (
        <View style={styles.form}>
          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isUploadingLogo}
            onPress={handleLogoPress}
            style={[styles.logoBox, isUploadingLogo ? styles.disabledButton : null]}
          >
            {isUploadingLogo ? (
              <ActivityIndicator color={theme.primary} />
            ) : logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
            ) : (
              <Upload color={theme.placeholder} size={34} />
            )}
            <Text style={styles.logoText}>
              {isUploadingLogo ? "Subiendo logo..." : "Cargar Logo"}
            </Text>
            <Text style={styles.logoHint}>JPG, PNG - MAX 2MB</Text>
          </TouchableOpacity>

          <InputField
            label="Nombre del Negocio"
            onChangeText={setBusinessName}
            value={businessName}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Rubro / Categoria</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert("Rubro / Categoria", "Por ahora podes editar el texto directamente.")
              }
              style={styles.selectLike}
            >
              <TextInput
                onChangeText={setCategory}
                style={styles.selectInput}
                value={category}
              />
              <ChevronDown color={theme.text} size={18} />
            </TouchableOpacity>
          </View>

          <InputField
            inputStyle={styles.textArea}
            label="Descripcion del Negocio"
            multiline
            onChangeText={setDescription}
            placeholder="Escriba una breve descripcion..."
            value={description}
          />

          <View style={styles.closingCard}>
            <View>
              <Text style={styles.closingLabel}>Horario de Cierre</Text>
              <View style={styles.closingInputRow}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={5}
                  onChangeText={(value) =>
                    setClosingTime((current) =>
                      maskClosingTimeInput(value, current)
                    )
                  }
                  placeholder="22:00"
                  placeholderTextColor={theme.placeholder}
                  style={styles.closingTimeInput}
                  value={closingTime}
                />
                <Text style={styles.closingSuffix}>hs</Text>
              </View>
              <Text style={styles.closingHint}>
                Se guarda como {formatClosingTimeDisplay(closingTime)}
              </Text>
            </View>
            <View style={styles.clockBox}>
              <Clock color={theme.primary} size={30} />
            </View>
          </View>

          <View style={styles.themeCard}>
            <View style={styles.themeTextBlock}>
              <Text style={styles.themeCardTitle}>Tema de la aplicacion</Text>
              <Text style={styles.themeCardDescription}>
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

          <View style={styles.paymentCard}>
            <View style={styles.paymentTitleRow}>
              <CreditCard color={theme.secondary} size={18} />
              <Text style={styles.paymentTitle}>Datos para Recibir Pagos</Text>
            </View>
            <InputField
              label="Nombre del Titular"
              onChangeText={setHolderName}
              placeholder="Nombre completo"
              value={holderName}
            />
            <InputField
              label="CVU"
              onChangeText={setCvu}
              placeholder="0000003100010123456789"
              value={cvu}
            />
            <InputField
              label="Alias Bancario"
              onChangeText={setBankAlias}
              value={bankAlias}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isSaving}
            onPress={handleSave}
            style={[styles.saveButton, isSaving ? styles.disabledButton : null]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.publicationsBlock}>
          <View style={styles.publicationsHeader}>
            <Text style={styles.publicationsTitle}>Administrar Menu</Text>
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => router.push("/(business)/publish")}
              style={styles.newButton}
            >
              <Text style={styles.newButtonText}>+ Nueva</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsRow}>
            <Chip accent="primary" label={`Activas: ${activeCount}`} />
            <Chip label={`Ocultas: ${hiddenCount}`} />
          </View>

          {isLoadingOffers ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={theme.primary} />
              <Text style={styles.loadingText}>Cargando publicaciones...</Text>
            </View>
          ) : offersError ? (
            <EmptyState title="No pudimos cargar publicaciones" description={offersError} />
          ) : offers.length === 0 ? (
            <EmptyState title="Todavia no hay publicaciones para este local." />
          ) : (
            <View style={styles.offerList}>
              {offers.map((offer) => (
                <PublicationCard
                  key={offer.id}
                  isUpdatingVisibility={visibilityLoadingId === offer.id}
                  offer={offer}
                  onEditPress={(selectedOffer) =>
                    router.push({
                      pathname: "/(business)/edit-offer/[id]",
                      params: { id: selectedOffer.id }
                    })
                  }
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

function StoreTabButton({
  isActive,
  label,
  onPress
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
    >
      <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InputField({
  inputStyle,
  label,
  multiline,
  onChangeText,
  placeholder,
  value
}: {
  inputStyle?: object;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        style={[styles.input, inputStyle]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

function Chip({ accent, label }: { accent?: "primary"; label: string }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isPrimary = accent === "primary";
  return (
    <View style={[styles.chip, isPrimary ? styles.chipPrimary : null]}>
      <Text style={[styles.chipText, isPrimary ? styles.chipTextPrimary : null]}>
        {label}
      </Text>
    </View>
  );
}

function PublicationCard({
  isUpdatingVisibility,
  offer,
  onEditPress,
  onToggleVisibility
}: {
  isUpdatingVisibility: boolean;
  offer: Offer;
  onEditPress: (offer: Offer) => void;
  onToggleVisibility: (offer: Offer) => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isHidden = offer.isVisible === false;
  const isMuted = isHidden || offer.stock <= 0;
  const [imageFailed, setImageFailed] = useState(false);
  const imageUri = getRemoteImageUri(offer.imageUrl);
  const showImage = Boolean(imageUri && !imageFailed);

  return (
    <View style={[styles.publicationCard, isHidden ? styles.publicationCardHidden : null]}>
      <View style={styles.publicationImageFrame}>
        {showImage ? (
          <Image
            onError={() => setImageFailed(true)}
            source={{ uri: imageUri }}
            style={styles.publicationImage}
          />
        ) : (
          <View style={styles.publicationImageFallback}>
            <Text style={styles.publicationImageInitial}>
              {getOfferInitial(offer.title)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.publicationInfo}>
        <Text style={[styles.offerTitle, isMuted ? styles.hiddenText : null]}>
          {offer.title}
        </Text>
        <Text style={[styles.offerPrice, isMuted ? styles.hiddenPrice : null]}>
          {formatCurrency(offer.newPrice)}
        </Text>
        <Text style={[styles.offerStock, isMuted ? styles.hiddenText : null]}>
          Stock: {offer.stock}
        </Text>
      </View>
      <View style={styles.publicationActions}>
        <IconButton
          icon={<Pencil color={theme.text} size={20} />}
          onPress={() => onEditPress(offer)}
        />
        <IconButton
          disabled={isUpdatingVisibility}
          icon={
            isUpdatingVisibility ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : isHidden ? (
              <EyeOff color={theme.placeholder} size={20} />
            ) : (
              <Eye color={theme.secondary} size={20} />
            )
          }
          onPress={() => onToggleVisibility(offer)}
        />
      </View>
    </View>
  );
}

function IconButton({
  disabled,
  icon,
  onPress
}: {
  disabled?: boolean;
  icon: ReactNode;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled ? styles.disabledButton : null]}
    >
      {icon}
    </TouchableOpacity>
  );
}

function inferMimeType(uri: string) {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith(".png")) {
    return "image/png";
  }

  return "image/jpeg";
}

function getExtension(mimeType: string) {
  return mimeType === "image/png" ? "png" : "jpg";
}

function isAllowedImageType(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

function getRemoteImageUri(value: string | undefined) {
  const cleanValue = value?.trim();
  return cleanValue?.startsWith("http") ? cleanValue : undefined;
}

function getOfferInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "F";
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  activeSegment: {
    backgroundColor: theme.primary
  },
  activeSegmentText: {
    color: theme.inverseText
  },
  chip: {
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  chipPrimary: {
    backgroundColor: `${theme.primary}12`,
    borderColor: `${theme.primary}55`
  },
  chipText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "900"
  },
  chipTextPrimary: {
    color: theme.primary
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  clockBox: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderRadius: radii.lg,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  closingCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  closingLabel: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  closingHint: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "700"
  },
  closingInputRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs
  },
  closingSuffix: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900"
  },
  closingTimeInput: {
    color: theme.text,
    fontSize: 30,
    fontWeight: "900",
    minHeight: 42,
    padding: 0,
    width: 78
  },
  content: {
    gap: spacing.md,
    paddingBottom: 96
  },
  disabledButton: {
    opacity: 0.72
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  fieldGroup: {
    gap: spacing.sm
  },
  form: {
    gap: spacing.md
  },
  hiddenPrice: {
    color: theme.placeholder
  },
  hiddenText: {
    color: theme.placeholder
  },
  iconButton: {
    alignItems: "center",
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  input: {
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: theme.text,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: theme.mutedText,
    fontSize: 14
  },
  logoBox: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderStyle: "dashed",
    borderWidth: 1.5,
    elevation: 2,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 160,
    padding: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  logoPreview: {
    borderRadius: radii.md,
    height: 72,
    width: 72
  },
  logoHint: {
    color: theme.placeholder,
    fontSize: 12,
    fontWeight: "900"
  },
  logoText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  newButton: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  newButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  offerList: {
    gap: spacing.md
  },
  offerPrice: {
    color: theme.text,
    fontSize: 26,
    fontWeight: "900"
  },
  offerStock: {
    color: theme.text,
    fontSize: 14
  },
  offerTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "900"
  },
  paymentCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  paymentTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  paymentTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  publicationActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  publicationCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  publicationCardHidden: {
    opacity: 0.82
  },
  publicationImage: {
    height: "100%",
    width: "100%"
  },
  publicationImageFallback: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  publicationImageFrame: {
    backgroundColor: theme.border,
    borderRadius: radii.md,
    height: 64,
    marginRight: spacing.md,
    overflow: "hidden",
    width: 64
  },
  publicationImageInitial: {
    color: theme.primary,
    fontSize: 22,
    fontWeight: "900"
  },
  publicationInfo: {
    flex: 1,
    gap: spacing.xs
  },
  publicationsBlock: {
    gap: spacing.md
  },
  publicationsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  publicationsTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900"
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 60
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  selectInput: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    minHeight: 48,
    padding: 0
  },
  selectLike: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  segmented: {
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 2
  },
  segmentText: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "800"
  },
  tabButton: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 46
  },
  tabButtonActive: {
    backgroundColor: theme.primary,
    elevation: 2,
    shadowColor: theme.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  tabText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  tabsRow: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: 520,
    width: "100%"
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md
  },
  themeCard: {
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
  themeCardDescription: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  themeCardTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  themeTextBlock: {
    flex: 1,
    gap: spacing.xs
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.header,
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarSpacer: {
    width: 44
  },
  topBarTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900"
  }
  });
}
