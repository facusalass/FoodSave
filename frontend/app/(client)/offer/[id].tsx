import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  PackageCheck
} from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EmptyState } from "../../../src/components/EmptyState";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { ScreenContainer } from "../../../src/components/ScreenContainer";
import { TextInputField } from "../../../src/components/TextInputField";
import { type AppColors, radii, spacing } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  getClientProfile,
  updateClientProfile,
  type ClientProfile
} from "../../../src/services/clientProfileService";
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from "../../../src/services/favoriteService";
import { getOfferById } from "../../../src/services/offerService";
import { createReservation } from "../../../src/services/reservationService";
import type { Offer } from "../../../src/types/offer";
import { formatCurrency } from "../../../src/utils/formatCurrency";
import { getOfferPickupText } from "../../../src/utils/offerPickup";
import {
  hasValidReservationProfile,
  validateClientProfile,
  type ClientProfileValidationErrors
} from "../../../src/utils/profileValidation";

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, updateSessionUser } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const sessionToken = session?.token;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [profilePromptVisible, setProfilePromptVisible] = useState(false);
  const [profileForReservation, setProfileForReservation] =
    useState<ClientProfile | null>(null);
  const [profileCity, setProfileCity] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] =
    useState<ClientProfileValidationErrors>({});
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const loadOffer = useCallback(async (showLoader = true) => {
    if (!id) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setError(null);

      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const nextOffer = await getOfferById(id);
      setOffer(nextOffer);
      setImageFailed(false);
      setLogoFailed(false);

      if (sessionToken) {
        try {
          setFavoriteError(null);
          const favorites = await getFavorites(sessionToken);
          setIsFavorite(
            favorites.some((favorite) => favorite.id === nextOffer.id)
          );
        } catch {
          setFavoriteError(
            "No pudimos cargar favoritos por ahora. La oferta sigue disponible."
          );
        }
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar la oferta.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, sessionToken]);

  useFocusEffect(
    useCallback(() => {
      void loadOffer(false);
    }, [loadOffer])
  );

  async function handleReserve() {
    if (!session) {
      setReserveError("Necesitas iniciar sesion para reservar.");
      return;
    }

    if (!offer) {
      setReserveError("La oferta solicitada no esta disponible.");
      return;
    }

    if (offer.stock < 1) {
      setReserveError("Esta oferta ya no tiene cupos disponibles.");
      return;
    }

    try {
      setReserveError(null);
      setIsReserving(true);
      const profile = await getClientProfile(session.token);

      if (!hasValidReservationProfile(profile)) {
        setProfileForReservation(profile);
        setProfileCity(profile.city ?? "");
        setProfileAddress(profile.address ?? "");
        setProfilePromptVisible(true);
        setIsReserving(false);
        return;
      }

      await reserveOffer();
    } catch (reserveErrorValue) {
      const message =
        reserveErrorValue instanceof Error
          ? reserveErrorValue.message
          : "No pudimos crear la reserva.";
      setReserveError(message);
    } finally {
      setIsReserving(false);
    }
  }

  async function reserveOffer() {
    if (!session || !offer) {
      return;
    }

    const nextReservation = await createReservation(session.token, offer.id);
    router.replace({
      pathname: "/(client)/reservation-confirmed",
      params: { reservationId: nextReservation.id }
    });
  }

  async function handleSaveProfileAndContinue() {
    if (!session || !offer || isSavingProfile || isReserving) {
      return;
    }

    const nextErrors = validateClientProfile(
      {
        address: profileAddress,
        city: profileCity,
        name: profileForReservation?.name ?? session.user.name,
        phone: profileForReservation?.phone ?? session.user.phone
      },
      { requireAddress: true, requireCity: true }
    );
    setProfileFieldErrors(nextErrors);
    setReserveError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const name = (profileForReservation?.name ?? session.user.name).trim();

    if (!name) {
      setReserveError("No pudimos guardar tu perfil porque falta tu nombre.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const user = await updateClientProfile(session.token, {
        address: profileAddress.trim(),
        city: profileCity.trim(),
        name,
        phone: profileForReservation?.phone ?? session.user.phone ?? ""
      });

      await updateSessionUser(user);
      setProfilePromptVisible(false);
      setProfileForReservation(user);
      setIsReserving(true);
      await reserveOffer();
    } catch (errorValue) {
      const message =
        errorValue instanceof Error
          ? errorValue.message
          : "No pudimos guardar tus datos.";
      setReserveError(message);
    } finally {
      setIsSavingProfile(false);
      setIsReserving(false);
    }
  }

  async function handleFavoritePress() {
    if (!session) {
      setFavoriteError("Necesitas iniciar sesion para guardar favoritos.");
      return;
    }

    if (!offer) {
      return;
    }

    const nextIsFavorite = !isFavorite;
    setFavoriteError(null);
    setIsFavorite(nextIsFavorite);

    try {
      if (nextIsFavorite) {
        await addFavorite(session.token, offer.id);
      } else {
        await removeFavorite(session.token, offer.id);
      }
    } catch {
      setIsFavorite(!nextIsFavorite);
      setFavoriteError(
        "No pudimos actualizar tus favoritos. Intenta de nuevo en unos segundos."
      );
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.metaText}>Cargando oferta...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!offer || error) {
    return (
      <ScreenContainer>
        <EmptyState
          description={error ?? "La oferta solicitada no esta disponible."}
          title="No encontramos esta oferta"
        />
      </ScreenContainer>
    );
  }

  const imageUri = getRemoteImageUri(offer.imageUrl);
  const logoUri = getRemoteImageUri(offer.logoUrl);
  const showImage = Boolean(imageUri && !imageFailed);
  const showLogo = Boolean(logoUri && !logoFailed);
  const discountPercentage = getDiscountPercentage(offer.oldPrice, offer.newPrice);

  return (
    <ScreenContainer
      onRefresh={() => {
        void loadOffer(false);
      }}
      refreshing={isRefreshing}
    >
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => {
            void handleFavoritePress();
          }}
          style={[
            styles.favoriteButton,
            isFavorite ? styles.favoriteButtonActive : null
          ]}
        >
          <Heart
            color={isFavorite ? theme.primary : theme.mutedText}
            fill={isFavorite ? theme.primary : "transparent"}
            size={22}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.imageFrame}>
        {showImage ? (
          <Image
            onError={() => setImageFailed(true)}
            source={{ uri: imageUri }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackBrand}>FoodSave</Text>
            <Text numberOfLines={2} style={styles.imageFallbackText}>
              {offer.title}
            </Text>
          </View>
        )}
        {discountPercentage ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {offer.type === "mystery_box" ? "MYSTERY BOX" : offer.category}
        </Text>
      </View>

      <View style={styles.storeRow}>
        {showLogo ? (
          <Image
            onError={() => setLogoFailed(true)}
            source={{ uri: logoUri }}
            style={styles.storeLogo}
          />
        ) : (
          <View style={styles.storeLogoPlaceholder}>
            <Text style={styles.storeLogoInitial}>
              {getStoreInitial(offer.storeName)}
            </Text>
          </View>
        )}
        <Text style={styles.store}>{offer.storeName}</Text>
      </View>
      <Text style={styles.title}>{offer.title}</Text>
      <Text style={styles.description}>{offer.description}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>{formatCurrency(offer.oldPrice)}</Text>
        <Text style={styles.newPrice}>{formatCurrency(offer.newPrice)}</Text>
      </View>

      <View style={styles.infoGrid}>
        <InfoItem
          icon={<PackageCheck color={theme.secondary} size={19} />}
          label="Cupos disponibles"
          value={`${offer.stock} disponibles`}
        />
        <InfoItem
          icon={<Clock color={theme.secondary} size={19} />}
          label="Horario de retiro"
          value={getOfferPickupText(offer)}
        />
        <InfoItem
          icon={<MapPin color={theme.secondary} size={19} />}
          label="Direccion"
          value={getOfferAddress(offer)}
        />
      </View>

      <View style={styles.allergensCard}>
        <Text style={styles.infoLabel}>Alergenos</Text>
        <Text style={styles.infoValue}>
          {offer.allergens.length > 0
            ? offer.allergens.join(", ")
            : "Consultar en el local"}
        </Text>
      </View>

      {favoriteError ? (
        <Text style={styles.favoriteError}>{favoriteError}</Text>
      ) : null}
      {reserveError ? <Text style={styles.errorText}>{reserveError}</Text> : null}

      {profilePromptVisible ? (
        <View style={styles.profilePrompt}>
          <Text style={styles.profilePromptTitle}>Completa tus datos</Text>
          <Text style={styles.profilePromptText}>
            Para reservar necesitamos que completes tu ciudad y direccion.
          </Text>
          <TextInputField
            autoCapitalize="words"
            editable={!isSavingProfile && !isReserving}
            error={profileFieldErrors.city}
            label="Ciudad"
            onChangeText={(value) => {
              setProfileCity(value);
              setProfileFieldErrors((current) => ({
                ...current,
                city: undefined
              }));
            }}
            placeholder="Ej: Resistencia, Chaco"
            value={profileCity}
          />
          <TextInputField
            autoCapitalize="words"
            editable={!isSavingProfile && !isReserving}
            error={profileFieldErrors.address}
            label="Direccion"
            onChangeText={(value) => {
              setProfileAddress(value);
              setProfileFieldErrors((current) => ({
                ...current,
                address: undefined
              }));
            }}
            placeholder="Ej: Av. San Martin 123"
            value={profileAddress}
          />
          <PrimaryButton
            isLoading={isSavingProfile || isReserving}
            label="GUARDAR Y CONTINUAR"
            onPress={handleSaveProfileAndContinue}
          />
        </View>
      ) : null}

      <PrimaryButton
        disabled={offer.stock < 1 || profilePromptVisible}
        isLoading={isReserving}
        label={offer.stock < 1 ? "SIN CUPOS" : "RESERVAR"}
        onPress={handleReserve}
      />
    </ScreenContainer>
  );
}

function getOfferAddress(offer: Offer) {
  if (offer.storeAddress) {
    return offer.storeAddress;
  }

  return [offer.address, offer.city].filter(Boolean).join(", ");
}

function getStoreInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "F";
}

function getRemoteImageUri(value: string | undefined) {
  const cleanValue = value?.trim();
  return cleanValue?.startsWith("http") ? cleanValue : undefined;
}

function getDiscountPercentage(oldPrice: number, newPrice: number) {
  if (oldPrice <= 0 || newPrice <= 0 || newPrice >= oldPrice) {
    return null;
  }

  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function InfoItem({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.infoItem}>
      {icon}
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  allergensCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  backButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  favoriteButtonActive: {
    backgroundColor: `${theme.primary}1A`,
    borderColor: `${theme.primary}55`
  },
  favoriteError: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.md
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: `${theme.secondary}1A`,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  description: {
    color: theme.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md
  },
  errorText: {
    color: theme.danger,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.md
  },
  discountBadge: {
    backgroundColor: theme.primary,
    borderRadius: radii.sm,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
    top: spacing.md
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  image: {
    height: "100%",
    width: "100%"
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    gap: spacing.sm,
    height: "100%",
    justifyContent: "center",
    padding: spacing.lg,
    width: "100%"
  },
  imageFallbackBrand: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  imageFallbackText: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  imageFrame: {
    backgroundColor: theme.border,
    borderRadius: radii.lg,
    height: 220,
    marginBottom: spacing.md,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  infoGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  infoItem: {
    alignItems: "flex-start",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  infoLabel: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  infoText: {
    flex: 1,
    gap: spacing.xs
  },
  infoValue: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "700"
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  metaText: {
    color: theme.mutedText,
    fontSize: 14
  },
  newPrice: {
    color: theme.primary,
    fontSize: 30,
    fontWeight: "900"
  },
  oldPrice: {
    color: theme.mutedText,
    fontSize: 18,
    textDecorationLine: "line-through"
  },
  priceRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  profilePrompt: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  profilePromptText: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  profilePromptTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "900"
  },
  store: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  storeLogo: {
    backgroundColor: theme.border,
    borderColor: theme.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    width: 32
  },
  storeLogoInitial: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  storeLogoPlaceholder: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderColor: `${theme.primary}55`,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  storeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  }
  });
}
