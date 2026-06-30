import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Pencil,
  Plus,
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
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import {
  getBusinessOffers,
  getBusinessProfile,
  updateBusinessOfferVisibility,
  updateBusinessProfile
} from "../../src/services/offerService";
import type { Offer } from "../../src/types/offer";
import { formatCurrency } from "../../src/utils/formatCurrency";

type StoreTab = "settings" | "publications";

const DEFAULT_CLOSING_TIME = "22:00";
const DEFAULT_CATEGORY = "Panaderia / Pasteleria";

export default function BusinessStoreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<StoreTab>("settings");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
      setClosingTime(business.closingTime ?? DEFAULT_CLOSING_TIME);
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
      void loadProfile();
      void loadOffers();
    }, [loadOffers, loadProfile])
  );

  async function handleSave() {
    if (!session || isSaving) {
      return;
    }

    const cleanName = businessName.trim();
    const cleanCategory = category.trim();
    const cleanClosingTime = closingTime.trim();
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

  function handleLogoPress() {
    Alert.alert(
      "Cargar logo",
      "El backend ya permite subir imagenes, pero falta agregar un selector de imagen en la app para elegir el logo."
    );
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
        <Text style={styles.topBarTitle}>Mi Local</Text>
      </View>

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
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos del local...</Text>
        </View>
      ) : activeTab === "settings" && profileError && !businessName ? (
        <EmptyState title="No pudimos cargar el local" description={profileError} />
      ) : activeTab === "settings" ? (
        <View style={styles.form}>
          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogoPress}
            style={styles.logoBox}
          >
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
            ) : (
              <Upload color="#94A3B8" size={34} />
            )}
            <Text style={styles.logoText}>Cargar Logo</Text>
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
              <ChevronDown color={colors.text} size={18} />
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
              <TextInput
                onChangeText={setClosingTime}
                placeholder="22:00"
                placeholderTextColor="#94A3B8"
                style={styles.closingTimeInput}
                value={closingTime}
              />
            </View>
            <View style={styles.clockBox}>
              <Clock color={colors.primary} size={30} />
            </View>
          </View>

          <View style={styles.paymentCard}>
            <View style={styles.paymentTitleRow}>
              <CreditCard color={colors.secondary} size={18} />
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
              <ActivityIndicator color={colors.primary} />
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
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, inputStyle]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

function Chip({ accent, label }: { accent?: "primary"; label: string }) {
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
  onToggleVisibility
}: {
  isUpdatingVisibility: boolean;
  offer: Offer;
  onToggleVisibility: (offer: Offer) => void;
}) {
  const isHidden = offer.isVisible === false;
  const isMuted = isHidden || offer.stock <= 0;

  return (
    <View style={[styles.publicationCard, isHidden ? styles.publicationCardHidden : null]}>
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
          icon={<Pencil color={colors.text} size={20} />}
          onPress={() =>
            Alert.alert("Proximamente", "La edicion de publicaciones se conectara mas adelante.")
          }
        />
        <IconButton
          disabled={isUpdatingVisibility}
          icon={
            isUpdatingVisibility ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : isHidden ? (
              <EyeOff color="#94A3B8" size={20} />
            ) : (
              <Eye color={colors.secondary} size={20} />
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

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#F8FAFC",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  chipPrimary: {
    backgroundColor: "#FF6B3512",
    borderColor: "#FDBA74"
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  chipTextPrimary: {
    color: colors.primary
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  clockBox: {
    alignItems: "center",
    backgroundColor: "#FF6B3514",
    borderRadius: radii.lg,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  closingCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  closingTimeInput: {
    color: "#020617",
    fontSize: 30,
    fontWeight: "900",
    minHeight: 42,
    minWidth: 120,
    padding: 0
  },
  content: {
    gap: spacing.md
  },
  disabledButton: {
    opacity: 0.72
  },
  errorText: {
    color: colors.danger,
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
    color: "#94A3B8"
  },
  hiddenText: {
    color: "#94A3B8"
  },
  iconButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  input: {
    backgroundColor: colors.card,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: 14
  },
  logoBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#CBD5E1",
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
  logoText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  newButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
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
    color: "#020617",
    fontSize: 26,
    fontWeight: "900"
  },
  offerStock: {
    color: colors.text,
    fontSize: 14
  },
  offerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  paymentTitle: {
    color: colors.text,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    color: "#020617",
    fontSize: 20,
    fontWeight: "900"
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
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
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    minHeight: 48,
    padding: 0
  },
  selectLike: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#CBD5E1",
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
  tabButton: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 46
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  tabText: {
    color: colors.text,
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
  topBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: "center",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarTitle: {
    color: "#020617",
    fontSize: 18,
    fontWeight: "900"
  }
});
