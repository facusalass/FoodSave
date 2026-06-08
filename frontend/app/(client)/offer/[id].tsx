import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, MapPin, PackageCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { colors, radii, spacing } from "../../../src/constants/theme";
import { getOfferById } from "../../../src/services/offerService";
import type { Offer } from "../../../src/types/offer";
import { formatCurrency } from "../../../src/utils/formatCurrency";

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffer() {
      if (!id) {
        return;
      }

      try {
        const nextOffer = await getOfferById(id);
        setOffer(nextOffer);
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
  }, [id]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.metaText}>Cargando oferta...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!offer || error) {
    return (
      <ScreenContainer>
        <EmptyState
          description={error ?? "La oferta solicitada no está disponible."}
          title="No encontramos esta oferta"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft color={colors.text} size={20} />
      </TouchableOpacity>

      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {offer.type === "mystery_box" ? "MYSTERY BOX" : offer.category}
        </Text>
      </View>

      <Text style={styles.store}>{offer.storeName}</Text>
      <Text style={styles.title}>{offer.title}</Text>
      <Text style={styles.description}>{offer.description}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>{formatCurrency(offer.oldPrice)}</Text>
        <Text style={styles.newPrice}>{formatCurrency(offer.newPrice)}</Text>
      </View>

      <View style={styles.infoGrid}>
        <InfoItem
          icon={<PackageCheck color={colors.secondary} size={19} />}
          label="Stock"
          value={`${offer.stock} disponibles`}
        />
        <InfoItem
          icon={<Clock color={colors.secondary} size={19} />}
          label="Límite de retiro"
          value={offer.pickupLimit}
        />
        <InfoItem
          icon={<MapPin color={colors.secondary} size={19} />}
          label="Ubicación"
          value={`${offer.address}, ${offer.city}`}
        />
      </View>

      <View style={styles.allergensCard}>
        <Text style={styles.infoLabel}>Alérgenos</Text>
        <Text style={styles.infoValue}>{offer.allergens.join(", ")}</Text>
      </View>

      <PrimaryButton
        label="RESERVAR"
        onPress={() => undefined}
      />
    </ScreenContainer>
  );
}

function InfoItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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

const styles = StyleSheet.create({
  allergensCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 42
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#14B8A61A",
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  description: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md
  },
  image: {
    backgroundColor: colors.border,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  infoLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  infoText: {
    flex: 1,
    gap: spacing.xs
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  metaText: {
    color: colors.mutedText,
    fontSize: 14
  },
  newPrice: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "900"
  },
  oldPrice: {
    color: colors.mutedText,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.sm
  }
});
