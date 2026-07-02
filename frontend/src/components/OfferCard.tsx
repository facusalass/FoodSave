import { Clock, Heart } from "lucide-react-native";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { colors, radii, spacing } from "../constants/theme";
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
  return (
    <View style={styles.card}>
      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.storeBlock}>
            {offer.logoUrl ? (
              <Image source={{ uri: offer.logoUrl }} style={styles.logo} />
            ) : null}
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
                color={isFavorite ? colors.primary : colors.mutedText}
                fill={isFavorite ? colors.primary : "transparent"}
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
            <Clock color={colors.mutedText} size={15} />
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

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    borderColor: colors.secondary,
    borderRadius: radii.sm,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  ctaText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "800"
  },
  description: {
    color: colors.mutedText,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  favoriteButtonActive: {
    backgroundColor: "#FF6B351A",
    borderColor: "#FF6B3555"
  },
  image: {
    backgroundColor: colors.border,
    borderRadius: radii.md,
    height: 94,
    width: 94
  },
  logo: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    width: 28
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs
  },
  metaText: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 13
  },
  newPrice: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right"
  },
  oldPrice: {
    color: colors.mutedText,
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
    color: colors.text,
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
