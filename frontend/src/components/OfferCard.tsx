import { Clock, Heart } from "lucide-react-native";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { type AppColors, radii, spacing } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import type { Offer } from "../types/offer";
import { formatCurrency } from "../utils/formatCurrency";
import { getOfferPickupText } from "../utils/offerPickup";

type OfferCardProps = {
  offer: Offer;
  isFavorite?: boolean;
  onPress: () => void;
  onFavoritePress?: () => void;
};

export function OfferCard({
  offer,
  isFavorite = false,
  onFavoritePress,
  onPress
}: OfferCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.storeBlock}>
            {offer.logoUrl ? (
              <Image source={{ uri: offer.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>
                  {getStoreInitial(offer.storeName)}
                </Text>
              </View>
            )}
            <Text numberOfLines={2} style={styles.store}>
              {offer.storeName.toUpperCase()}
            </Text>
          </View>
          {onFavoritePress ? (
            <TouchableOpacity
              accessibilityLabel={
                isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
              }
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={onFavoritePress}
              style={[
                styles.favoriteButton,
                isFavorite ? styles.favoriteButtonActive : null
              ]}
            >
              <Heart
                color={isFavorite ? theme.primary : theme.mutedText}
                fill={isFavorite ? theme.primary : "transparent"}
                size={18}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text numberOfLines={1} style={styles.description}>
          {offer.description}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>{formatCurrency(offer.oldPrice)}</Text>
          <Text style={styles.newPrice}>{formatCurrency(offer.newPrice)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Clock color={theme.mutedText} size={15} />
            <Text style={styles.metaText}>{getOfferPickupText(offer)}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Ver oferta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function getStoreInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "F";
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: theme.elevatedCard,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 132,
    padding: spacing.sm
  },
  content: {
    flex: 1,
    gap: spacing.xs
  },
  ctaButton: {
    alignItems: "center",
    borderColor: theme.secondary,
    borderRadius: radii.sm,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  ctaText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "800"
  },
  description: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 18
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  favoriteButtonActive: {
    backgroundColor: `${theme.primary}1A`,
    borderColor: `${theme.primary}55`
  },
  image: {
    backgroundColor: theme.border,
    borderRadius: radii.md,
    height: 94,
    width: 94
  },
  logo: {
    backgroundColor: theme.border,
    borderColor: theme.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    width: 28
  },
  logoInitial: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderColor: `${theme.primary}55`,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs
  },
  metaText: {
    color: theme.mutedText,
    flexShrink: 1,
    fontSize: 13
  },
  newPrice: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right"
  },
  oldPrice: {
    color: theme.mutedText,
    fontSize: 13,
    textAlign: "right",
    textDecorationLine: "line-through"
  },
  priceRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.sm
  },
  store: {
    color: theme.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20
  },
  storeBlock: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  }
  });
}
