import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Check, MapPin, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getCities } from "../../src/services/cityService";
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from "../../src/services/favoriteService";
import { getOffers } from "../../src/services/offerService";
import type { Offer } from "../../src/types/offer";
import { getFavoriteIds, toggleFavoriteId } from "../../src/utils/favorites";

const categories = ["Panaderia", "Rotiseria", "SuperMercado", "Mystery Box"];
const DEFAULT_CITY = "Resistencia, Chaco";

export default function ClientHomeScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const loadOffersForCity = useCallback(async (city: string | null) => {
    const nextOffers = await getOffers({ city });
    setOffers(nextOffers);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      try {
        setError(null);
        setIsLoading(true);
        const nextCities = await getCities();

        if (!isMounted) {
          return;
        }

        setCities(nextCities);

        const detectedCity = await detectCurrentCity(nextCities);

        if (!isMounted) {
          return;
        }

        const initialCity = detectedCity.city ?? getFallbackCity(nextCities);
        setSelectedCity(initialCity);
        setLocationHint(detectedCity.hint);

        const [nextOffers, favorites] = await Promise.all([
          getOffers({ city: initialCity }),
          session ? getFavorites(session.token).catch(() => null) : null
        ]);

        if (!isMounted) {
          return;
        }

        setOffers(nextOffers);

        if (favorites) {
          setFavoriteIds(getFavoriteIds(favorites));
        } else if (session) {
          setFavoriteError(
            "No pudimos cargar tus favoritos por ahora. Las ofertas siguen disponibles."
          );
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las ofertas.";

        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHome();

    return () => {
      isMounted = false;
    };
  }, [session]);

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

  async function handleCitySelect(city: string) {
    setIsCityModalVisible(false);
    setSelectedCity(city);
    setLocationHint(null);

    try {
      setError(null);
      setIsLoading(true);
      await loadOffersForCity(city);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar las ofertas de esa ciudad.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFavoritePress(offer: Offer) {
    if (!session) {
      setFavoriteError("Necesitas iniciar sesion para guardar favoritos.");
      return;
    }

    const nextIsFavorite = !favoriteIds.has(offer.id);
    setFavoriteError(null);
    setFavoriteIds((currentFavoriteIds) =>
      toggleFavoriteId(currentFavoriteIds, offer.id, nextIsFavorite)
    );

    try {
      if (nextIsFavorite) {
        await addFavorite(session.token, offer.id);
      } else {
        await removeFavorite(session.token, offer.id);
      }
    } catch {
      setFavoriteIds((currentFavoriteIds) =>
        toggleFavoriteId(currentFavoriteIds, offer.id, !nextIsFavorite)
      );
      setFavoriteError(
        "No pudimos actualizar tus favoritos. Intenta de nuevo en unos segundos."
      );
    }
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
            <Search color={theme.mutedText} size={20} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Buscar comercios..."
              placeholderTextColor={theme.placeholder}
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsCityModalVisible(true)}
            style={styles.cityButton}
          >
            <MapPin color={theme.text} size={16} />
            <Text numberOfLines={1} style={styles.cityText}>
              {selectedCity ?? "CIUDAD"}
            </Text>
          </TouchableOpacity>
        </View>

        {locationHint ? (
          <Text style={styles.locationHint}>{locationHint}</Text>
        ) : null}

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
      {favoriteError ? (
        <Text style={styles.favoriteError}>{favoriteError}</Text>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando ofertas...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar el inicio" description={error} />
      ) : offers.length === 0 ? (
        <EmptyState
          description={
            selectedCity
              ? "Proba cambiar de ciudad o volver mas tarde."
              : "Volve mas tarde para ver nuevas ofertas."
          }
          title={
            selectedCity
              ? `No hay ofertas disponibles en ${selectedCity} por ahora.`
              : "No hay ofertas disponibles por ahora."
          }
        />
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          description="Proba cambiar la busqueda, categoria o ciudad."
          title="No se encontraron ofertas"
        />
      ) : (
        <View style={styles.list}>
          {filteredOffers.map((offer) => (
            <OfferCard
              isFavorite={favoriteIds.has(offer.id)}
              key={offer.id}
              offer={offer}
              onFavoritePress={() => {
                void handleFavoritePress(offer);
              }}
              onPress={() => router.push(`/(client)/offer/${offer.id}`)}
            />
          ))}
        </View>
      )}

      <CitySelectorModal
        cities={cities}
        onClose={() => setIsCityModalVisible(false)}
        onSelect={(city) => {
          void handleCitySelect(city);
        }}
        selectedCity={selectedCity}
        visible={isCityModalVisible}
      />
    </ScreenContainer>
  );
}

function CitySelectorModal({
  cities,
  onClose,
  onSelect,
  selectedCity,
  visible
}: {
  cities: string[];
  onClose: () => void;
  onSelect: (city: string) => void;
  selectedCity: string | null;
  visible: boolean;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Elegir ciudad</Text>
            <TouchableOpacity
              accessibilityLabel="Cerrar selector de ciudad"
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <X color={theme.text} size={22} />
            </TouchableOpacity>
          </View>

          {cities.length === 0 ? (
            <Text style={styles.modalEmptyText}>
              No hay ciudades disponibles por ahora.
            </Text>
          ) : (
            <View style={styles.cityList}>
              {cities.map((city) => {
                const isSelected = city === selectedCity;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    key={city}
                    onPress={() => onSelect(city)}
                    style={[
                      styles.cityOption,
                      isSelected ? styles.cityOptionActive : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        isSelected ? styles.cityOptionTextActive : null
                      ]}
                    >
                      {city}
                    </Text>
                    {isSelected ? (
                      <Check color={theme.secondaryDark} size={18} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

async function detectCurrentCity(cities: string[]) {
  if (cities.length === 0) {
    return { city: null, hint: null };
  }

  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return {
        city: null,
        hint: "No pudimos detectar tu ubicacion. Elegi una ciudad manualmente."
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    const geocodeResults = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
    const matchedCity = matchDetectedCity(geocodeResults[0], cities);

    if (!matchedCity) {
      return {
        city: null,
        hint: "No encontramos ofertas para tu ubicacion. Elegi una ciudad disponible."
      };
    }

    return { city: matchedCity, hint: null };
  } catch {
    return {
      city: null,
      hint: "No pudimos detectar tu ubicacion. Elegi una ciudad manualmente."
    };
  }
}

function matchDetectedCity(
  location: Location.LocationGeocodedAddress | undefined,
  cities: string[]
) {
  if (!location) {
    return null;
  }

  const candidates = buildCityCandidates(location).map(normalize);

  return (
    cities.find((city) => candidates.includes(normalize(city))) ??
    cities.find((city) => {
      const normalizedCity = normalize(city);
      return candidates.some(
        (candidate) =>
          normalizedCity.includes(candidate) ||
          candidate.includes(normalizedCity)
      );
    }) ??
    null
  );
}

function buildCityCandidates(location: Location.LocationGeocodedAddress) {
  const localities = [
    location.city,
    location.district,
    location.subregion
  ].filter(isNonEmptyString);
  const regions = [location.region, location.country].filter(isNonEmptyString);
  const candidates = new Set<string>();

  localities.forEach((locality) => {
    candidates.add(locality);
    regions.forEach((region) => {
      candidates.add(`${locality}, ${region}`);
    });
  });

  return Array.from(candidates);
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getFallbackCity(cities: string[]) {
  return (
    cities.find((city) => normalize(city) === normalize(DEFAULT_CITY)) ??
    cities[0] ??
    null
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  activeChip: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  activeChipText: {
    color: "#FFFFFF"
  },
  categoryChip: {
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 13,
    fontWeight: "800"
  },
  cityButton: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: 50,
    justifyContent: "center",
    maxWidth: 132,
    minWidth: 96,
    paddingHorizontal: spacing.sm
  },
  cityList: {
    gap: spacing.sm
  },
  cityOption: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  cityOptionActive: {
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}55`
  },
  cityOptionText: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  cityOptionTextActive: {
    color: theme.secondaryDark
  },
  cityText: {
    color: theme.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900"
  },
  content: {
    gap: spacing.lg
  },
  favoriteError: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700"
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
    color: theme.mutedText,
    fontSize: 14
  },
  locationHint: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "700"
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    gap: spacing.md,
    padding: spacing.lg
  },
  modalCloseButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
  },
  modalEmptyText: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modalOverlay: {
    backgroundColor: theme.overlay,
    flex: 1,
    justifyContent: "flex-end"
  },
  modalTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900"
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: theme.text,
    flex: 1,
    fontSize: 15
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900"
  }
  });
}
