import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  PackageCheck
} from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
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
import { type AppColors, radii, spacing } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
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

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffer() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const nextOffer = await getOfferById(id);
        setOffer(nextOffer);

        if (session) {
          try {
            const favorites = await getFavorites(session.token);
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
      }
    }

    loadOffer();
  }, [id, session]);

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
      const nextReservation = await createReservation(session.token, offer.id);
      router.replace({
        pathname: "/(client)/reservation-confirmed",
        params: { reservationId: nextReservation.id }
      });
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

  return (
    <ScreenContainer>
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

      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {offer.type === "mystery_box" ? "MYSTERY BOX" : offer.category}
        </Text>
      </View>

      <View style={styles.storeRow}>
        {offer.logoUrl ? (
          <Image source={{ uri: offer.logoUrl }} style={styles.storeLogo} />
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

      <PrimaryButton
        disabled={offer.stock < 1}
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
  image: {
    backgroundColor: theme.border,
    borderRadius: radii.lg,
    height: 220,
    marginBottom: spacing.md,
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
