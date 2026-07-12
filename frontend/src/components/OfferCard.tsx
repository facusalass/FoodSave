import { Clock, Heart, Sparkles } from "lucide-react-native";
import { useState } from "react";
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
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const imageUri = getRemoteImageUri(offer.imageUrl);
  const logoUri = getRemoteImageUri(offer.logoUrl);
  const showImage = Boolean(imageUri && !imageFailed);
  const showLogo = Boolean(logoUri && !logoFailed);
  const discountPercentage = getDiscountPercentage(offer.oldPrice, offer.newPrice);
  const isMysteryBox = offer.type === "mystery_box";

  return (
    <View style={[styles.card, isMysteryBox ? styles.mysteryCard : null]}>
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
        {isMysteryBox ? (
          <View style={styles.mysteryBadge}>
            <Sparkles color="#FFFFFF" size={14} />
            <Text style={styles.mysteryBadgeText}>Mystery Box</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.storeBlock}>
            {showLogo ? (
              <Image
                onError={() => setLogoFailed(true)}
                source={{ uri: logoUri }}
                style={styles.logo}
              />
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
        <Text numberOfLines={2} style={styles.description}>
          {offer.description}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.oldPrice}>{formatCurrency(offer.oldPrice)}</Text>
            <Text style={styles.newPrice}>{formatCurrency(offer.newPrice)}</Text>
          </View>
          {offer.stock <= 3 ? (
            <View style={styles.stockPill}>
              <Text style={styles.stockPillText}>Quedan {offer.stock}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Clock color={theme.mutedText} size={15} />
            <Text style={styles.metaText}>{getOfferPickupText(offer)}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.ctaButton, isMysteryBox ? styles.ctaButtonMystery : null]}
          >
            <Text style={[styles.ctaText, isMysteryBox ? styles.ctaTextMystery : null]}>
              Ver oferta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
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

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: theme.elevatedCard,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5
  },
  mysteryCard: {
    borderColor: `${theme.primary}AA`,
    elevation: 4,
    shadowColor: theme.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8
  },
  content: {
    gap: spacing.sm,
    padding: spacing.md
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
  ctaButtonMystery: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  ctaText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "800"
  },
  ctaTextMystery: {
    color: "#FFFFFF"
  },
  description: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 18
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
    height: "100%",
    width: "100%"
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    gap: spacing.xs,
    height: "100%",
    justifyContent: "center",
    padding: spacing.lg,
    width: "100%"
  },
  imageFallbackBrand: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  imageFallbackText: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  },
  imageFrame: {
    backgroundColor: theme.border,
    height: 152,
    position: "relative",
    width: "100%"
  },
  mysteryBadge: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderColor: "#FFFFFF66",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: spacing.md,
    top: spacing.md
  },
  mysteryBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
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
    fontSize: 23,
    fontWeight: "900"
  },
  oldPrice: {
    color: theme.mutedText,
    fontSize: 13,
    textDecorationLine: "line-through"
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
  },
  stockPill: {
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}55`,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  stockPillText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  }
  });
}
