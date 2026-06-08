import { useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { Header } from "../../src/components/Header";
import { OfferCard } from "../../src/components/OfferCard";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { getOffers } from "../../src/services/offerService";
import type { Offer } from "../../src/types/offer";

const categories = ["Panadería", "Rotisería", "Vegetariano"];

export default function ClientHomeScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const nextOffers = await getOffers();
        setOffers(nextOffers);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las ofertas.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadOffers();
  }, []);

  const filteredOffers = useMemo(() => {
    if (!activeCategory) {
      return offers;
    }

    return offers.filter((offer) => offer.category === activeCategory);
  }, [activeCategory, offers]);

  return (
    <ScreenContainer>
      <Header
        rightAction={
          <TouchableOpacity activeOpacity={0.85} style={styles.iconButton}>
            <Bell color={colors.text} size={20} />
          </TouchableOpacity>
        }
        subtitle="Resistencia, Chaco"
        title="Ofertas cercanas"
      />

      <View style={styles.searchBox}>
        <Search color={colors.mutedText} size={18} />
        <Text style={styles.searchText}>Buscar comercios...</Text>
      </View>

      <View style={styles.categoryRow}>
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              key={category}
              onPress={() => setActiveCategory(isActive ? null : category)}
              style={[styles.categoryChip, isActive ? styles.activeChip : null]}
            >
              <Text
                style={[
                  styles.categoryText,
                  isActive ? styles.activeChipText : null
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando ofertas...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar el inicio" description={error} />
      ) : filteredOffers.length === 0 ? (
        <EmptyState title="No se encontraron ofertas" />
      ) : (
        <View style={styles.list}>
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onPress={() => router.push(`/(client)/offer/${offer.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  activeChip: {
    backgroundColor: colors.secondary
  },
  activeChipText: {
    color: "#FFFFFF"
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  categoryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  list: {
    gap: spacing.md
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
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  searchText: {
    color: colors.mutedText,
    fontSize: 15
  }
});
