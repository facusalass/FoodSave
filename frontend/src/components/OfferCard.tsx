import { Clock, MapPin, PackageCheck } from "lucide-react-native";
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
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <Image source={{ uri: offer.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.store}>
              {offer.storeName}
            </Text>
            <Text numberOfLines={2} style={styles.description}>
              {offer.description}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {offer.type === "mystery_box" ? "Mystery Box" : offer.category}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={colors.mutedText} size={15} />
            <Text style={styles.metaText}>{offer.pickupWindow}</Text>
          </View>
          <View style={styles.metaItem}>
            <PackageCheck color={colors.mutedText} size={15} />
            <Text style={styles.metaText}>{offer.stock} disponibles</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <MapPin color={colors.mutedText} size={15} />
            <Text numberOfLines={1} style={styles.metaText}>
              {offer.city}
            </Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.oldPrice}>{formatCurrency(offer.oldPrice)}</Text>
            <Text style={styles.newPrice}>{formatCurrency(offer.newPrice)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#14B8A61A",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "800"
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  content: {
    gap: spacing.md,
    padding: spacing.md
  },
  description: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 19
  },
  footer: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  image: {
    backgroundColor: colors.border,
    height: 142,
    width: "100%"
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md
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
  priceBlock: {
    alignItems: "flex-end"
  },
  store: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs
  }
});
