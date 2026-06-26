import { Clock } from "lucide-react-native";
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

type OfferCardProps = {
  offer: Offer;
  onPress: () => void;
};

export function OfferCard({ offer, onPress }: OfferCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.store}>
          {offer.storeName.toUpperCase()}
        </Text>
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
            <Text style={styles.metaText}>{offer.pickupWindow}</Text>
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
  image: {
    backgroundColor: colors.border,
    borderRadius: radii.md,
    height: 94,
    width: 94
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
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20
  }
});
