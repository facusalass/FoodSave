import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { EmptyState } from "../../src/components/EmptyState";
import { OfferCard } from "../../src/components/OfferCard";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { getOffers } from "../../src/services/offerService";
import type { Offer } from "../../src/types/offer";

const categories = ["Panaderia", "Rotiseria", "SuperMercado", "Mystery Box"];

export default function ClientHomeScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    const normalizedSearch = normalize(searchQuery);

    return offers.filter((offer) => {
      const matchesSearch =
        !normalizedSearch ||
        normalize(offer.storeName).includes(normalizedSearch) ||
        normalize(offer.title).includes(normalizedSearch) ||
        normalize(offer.description).includes(normalizedSearch);
      const matchesActiveCategory =
        !activeCategory || matchesCategory(offer, activeCategory);

      return matchesSearch && matchesActiveCategory;
    });
  }, [activeCategory, offers, searchQuery]);

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <ClientTopBar onMenuPress={() => setIsMenuVisible(true)} />
      <ClientSideMenu
        onClose={() => setIsMenuVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        visible={isMenuVisible}
      />

      <View style={styles.filtersBlock}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color={colors.mutedText} size={20} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Buscar comercios..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => undefined}
            style={styles.cityButton}
          >
            <Text style={styles.cityText}>CIUDAD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                key={category}
                onPress={() => setActiveCategory(isActive ? null : category)}
                style={[
                  styles.categoryChip,
                  isActive ? styles.activeChip : null
                ]}
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
      </View>

      <Text style={styles.sectionTitle}>Ofertas Cercanas</Text>

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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesCategory(offer: Offer, category: string) {
  const normalizedCategory = normalize(category);
  const offerCategory = normalize(offer.category);

  if (normalizedCategory === "mystery box") {
    return offer.type === "mystery_box" || offerCategory.includes("mystery");
  }

  if (normalizedCategory === "supermercado") {
    return offerCategory.includes("super");
  }

  if (normalizedCategory === "panaderia") {
    return offerCategory.includes("panader");
  }

  if (normalizedCategory === "rotiseria") {
    return offerCategory.includes("rotiser");
  }

  return offerCategory === normalizedCategory;
}

const styles = StyleSheet.create({
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
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
    paddingBottom: spacing.xs
  },
  categoryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  cityButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    minWidth: 88,
    paddingHorizontal: spacing.md
  },
  cityText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg
  },
  filtersBlock: {
    gap: spacing.md
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
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  }
});
