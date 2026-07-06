import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react-native";
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
import {
  ALL_OFFERS_FILTER_LABEL,
  getCanonicalOfferCategory,
  MYSTERY_BOX_FILTER_LABEL,
  OFFER_CATEGORIES,
  type OfferCategory,
  type OfferCategoryFilter
} from "../../src/constants/offerCategories";
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
import { sortOffersByStock } from "../../src/utils/offerStock";

const DEFAULT_CITY = "Resistencia, Chaco";
const COLLAPSED_CATEGORY_CHIP_COUNT = 5;

export default function ClientHomeScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const sessionToken = session?.token;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [areCategoriesExpanded, setAreCategoriesExpanded] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const loadOffersForCity = useCallback(async (city: string | null) => {
    const nextOffers = await getOffers({ city });
    setOffers(sortOffersByStock(nextOffers));
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!sessionToken) {
      setFavoriteIds(new Set());
      setFavoriteError(null);
      return;
    }

    try {
      setFavoriteError(null);
      const favorites = await getFavorites(sessionToken);
      setFavoriteIds(getFavoriteIds(favorites));
    } catch {
      setFavoriteError(
        "No pudimos cargar tus favoritos por ahora. Las ofertas siguen disponibles."
      );
    }
  }, [sessionToken]);

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

        const initialCity = getFallbackCity(nextCities);
        setSelectedCity(initialCity);
        setLocationHint(null);

        const nextOffers = await getOffers({ city: initialCity });

        if (!isMounted) {
          return;
        }

        setOffers(sortOffersByStock(nextOffers));

        if (sessionToken) {
          try {
            const favorites = await getFavorites(sessionToken);

            if (isMounted) {
              setFavoriteIds(getFavoriteIds(favorites));
              setFavoriteError(null);
            }
          } catch {
            if (isMounted) {
              setFavoriteError(
                "No pudimos cargar tus favoritos por ahora. Las ofertas siguen disponibles."
              );
            }
          }
        } else {
          setFavoriteIds(new Set());
          setFavoriteError(null);
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
  }, [sessionToken]);

  const refreshHomeData = useCallback(async () => {
    if (!selectedCity) {
      return;
    }

    try {
      setError(null);
      await Promise.all([
        loadOffersForCity(selectedCity),
        loadFavorites()
      ]);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos actualizar las ofertas.";
      setError(message);
    }
  }, [loadFavorites, loadOffersForCity, selectedCity]);

  useFocusEffect(
    useCallback(() => {
      void refreshHomeData();
    }, [refreshHomeData])
  );

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshHomeData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHomeData]);

  const filteredOffers = useMemo(() => {
    const normalizedSearch = normalize(searchQuery);

    return sortOffersByStock(offers.filter((offer) => {
      const matchesSearch =
        !normalizedSearch ||
        normalize(offer.storeName).includes(normalizedSearch) ||
        normalize(offer.title).includes(normalizedSearch) ||
        normalize(offer.description).includes(normalizedSearch);
      const matchesActiveCategory =
        !activeCategory || matchesCategory(offer, activeCategory);

      return matchesSearch && matchesActiveCategory;
    }));
  }, [activeCategory, offers, searchQuery]);

  const availableCategoryFilters = useMemo<OfferCategoryFilter[]>(() => {
    const inStockOffers = offers.filter((offer) => offer.stock > 0);
    const availableCategories = new Set<OfferCategory>();

    inStockOffers.forEach((offer) => {
      const category = getCanonicalOfferCategory(offer.category);

      if (category) {
        availableCategories.add(category);
      }
    });

    const filters: OfferCategoryFilter[] = [
      {
        label: ALL_OFFERS_FILTER_LABEL,
        type: "all",
        value: ALL_OFFERS_FILTER_LABEL
      }
    ];

    OFFER_CATEGORIES.forEach((category) => {
      if (availableCategories.has(category)) {
        filters.push({
          label: category,
          type: "category",
          value: category
        });
      }
    });

    if (inStockOffers.some((offer) => offer.type === "mystery_box")) {
      filters.push({
        label: MYSTERY_BOX_FILTER_LABEL,
        type: "type",
        value: "mystery_box"
      });
    }

    return filters;
  }, [offers]);

  const primaryCategoryFilters = useMemo(() => {
    if (availableCategoryFilters.length <= COLLAPSED_CATEGORY_CHIP_COUNT) {
      return availableCategoryFilters;
    }

    const firstFilters = availableCategoryFilters.slice(
      0,
      COLLAPSED_CATEGORY_CHIP_COUNT
    );
    const activeFilter = availableCategoryFilters.find((filter) =>
      filter.type === "all"
        ? activeCategory === null
        : activeCategory === filter.label
    );

    if (
      activeFilter &&
      !firstFilters.some((filter) => filter.label === activeFilter.label)
    ) {
      return [...firstFilters.slice(0, COLLAPSED_CATEGORY_CHIP_COUNT - 1), activeFilter];
    }

    return firstFilters;
  }, [activeCategory, availableCategoryFilters]);

  const extraCategoryFilters = useMemo(
    () =>
      availableCategoryFilters.filter(
        (filter) =>
          !primaryCategoryFilters.some(
            (primaryFilter) =>
              primaryFilter.type === filter.type &&
              primaryFilter.value === filter.value
          )
      ),
    [availableCategoryFilters, primaryCategoryFilters]
  );

  const hiddenCategoryCount =
    availableCategoryFilters.length - primaryCategoryFilters.length;

  useEffect(() => {
    if (!activeCategory) {
      return;
    }

    const isActiveCategoryAvailable = availableCategoryFilters.some(
      (filter) => filter.type !== "all" && filter.label === activeCategory
    );

    if (!isActiveCategoryAvailable) {
      setActiveCategory(null);
    }
  }, [activeCategory, availableCategoryFilters]);

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
    setShowLocationPrompt(false);

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

  async function handleUseLocationPress() {
    try {
      setError(null);
      setShowLocationPrompt(false);
      setIsDetectingLocation(true);
      const detectedCity = await detectCurrentCity(cities);

      if (!detectedCity.city) {
        setLocationHint(detectedCity.hint);
        return;
      }

      setSelectedCity(detectedCity.city);
      setLocationHint(null);
      setIsLoading(true);
      await loadOffersForCity(detectedCity.city);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar las ofertas para tu ubicacion.";
      setError(message);
    } finally {
      setIsDetectingLocation(false);
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

  function handleCategorySelect(filter: OfferCategoryFilter) {
    setActiveCategory(filter.type === "all" ? null : filter.label);
    setAreCategoriesExpanded(false);
  }

  return (
    <ScreenContainer
      contentStyle={styles.content}
      onRefresh={() => {
        void handleRefresh();
      }}
      refreshing={isRefreshing}
    >
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

        {showLocationPrompt && cities.length > 0 ? (
          <View style={styles.locationCard}>
            <View style={styles.locationIconBox}>
              <MapPin color={theme.secondaryDark} size={18} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Encontrar ofertas cerca</Text>
              <Text style={styles.locationText}>
                Podemos usar tu ubicacion para elegir la ciudad disponible mas cercana.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isDetectingLocation}
              onPress={() => {
                void handleUseLocationPress();
              }}
              style={[
                styles.locationAction,
                isDetectingLocation ? styles.locationActionDisabled : null
              ]}
            >
              {isDetectingLocation ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.locationActionText}>Usar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.categoryBlock}>
          <View style={styles.categoryRow}>
          {primaryCategoryFilters.map((filter, index) => {
            const isActive =
              filter.type === "all"
                ? activeCategory === null
                : activeCategory === filter.label;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                key={`${filter.type}-${filter.value}-${index}`}
                onPress={() => handleCategorySelect(filter)}
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
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {hiddenCategoryCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setAreCategoriesExpanded((currentValue) => !currentValue)
              }
              style={[
                styles.moreCategoryChip,
                areCategoriesExpanded ? styles.moreCategoryChipActive : null
              ]}
            >
              <ChevronDown
                color={theme.primary}
                size={15}
                style={
                  areCategoriesExpanded
                    ? styles.moreCategoryIconExpanded
                    : null
                }
              />
              <Text style={styles.moreCategoryText}>
                {areCategoriesExpanded ? "Ver menos" : `Ver mas (${hiddenCategoryCount})`}
              </Text>
            </TouchableOpacity>
          ) : null}
          </View>

          {areCategoriesExpanded && extraCategoryFilters.length > 0 ? (
            <View style={styles.categoryDropdown}>
              {extraCategoryFilters.map((filter, index) => {
                const isActive =
                  filter.type === "all"
                    ? activeCategory === null
                    : activeCategory === filter.label;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    key={`${filter.type}-${filter.value}-${index}`}
                    onPress={() => handleCategorySelect(filter)}
                    style={[
                      styles.categoryDropdownItem,
                      isActive ? styles.categoryDropdownItemActive : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryDropdownText,
                        isActive ? styles.categoryDropdownTextActive : null
                      ]}
                    >
                      {filter.label}
                    </Text>
                    {isActive ? (
                      <Check color={theme.primary} size={18} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
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
          title={
            activeCategory
              ? `No hay ofertas de ${activeCategory} por ahora.`
              : "No se encontraron ofertas"
          }
        />
      ) : (
        <View style={styles.list}>
          {filteredOffers.map((offer, index) => (
            <OfferCard
              isFavorite={favoriteIds.has(offer.id)}
              key={`${offer.id || offer.title}-${index}`}
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
              {cities.map((city, index) => {
                const isSelected = city === selectedCity;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    key={`${city}-${index}`}
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
  if (category === MYSTERY_BOX_FILTER_LABEL) {
    return offer.type === "mystery_box";
  }

  return getCanonicalOfferCategory(offer.category) === category;
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
  categoryBlock: {
    gap: spacing.sm
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 84,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  categoryDropdown: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm
  },
  categoryDropdownItem: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderRadius: radii.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  categoryDropdownItemActive: {
    backgroundColor: `${theme.primary}14`
  },
  categoryDropdownText: {
    color: theme.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  categoryDropdownTextActive: {
    color: theme.primary
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  categoryText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "900"
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
  locationAction: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 58,
    paddingHorizontal: spacing.sm
  },
  locationActionDisabled: {
    opacity: 0.72
  },
  locationActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  locationCard: {
    alignItems: "center",
    backgroundColor: `${theme.secondary}12`,
    borderColor: `${theme.secondary}45`,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  locationCopy: {
    flex: 1,
    gap: 2
  },
  locationHint: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "700"
  },
  locationIconBox: {
    alignItems: "center",
    backgroundColor: `${theme.secondary}1A`,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  locationText: {
    color: theme.mutedText,
    fontSize: 12,
    lineHeight: 17
  },
  locationTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "900"
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
  moreCategoryChip: {
    alignItems: "center",
    backgroundColor: `${theme.primary}14`,
    borderColor: `${theme.primary}55`,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  moreCategoryChipActive: {
    backgroundColor: `${theme.primary}22`
  },
  moreCategoryIconExpanded: {
    transform: [{ rotate: "180deg" }]
  },
  moreCategoryText: {
    color: theme.primary,
    fontSize: 12,
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
