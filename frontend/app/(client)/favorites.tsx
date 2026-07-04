import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { EmptyState } from "../../src/components/EmptyState";
import { OfferCard } from "../../src/components/OfferCard";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getFavorites,
  removeFavorite
} from "../../src/services/favoriteService";
import type { Offer } from "../../src/types/offer";

export default function ClientFavoritesScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [favorites, setFavorites] = useState<Offer[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const nextFavorites = await getFavorites(session.token);
      setFavorites(nextFavorites);
    } catch {
      setError("No pudimos cargar tus favoritos en este momento.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites])
  );

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  async function handleRemoveFavorite(offer: Offer) {
    if (!session) {
      setActionError("Necesitas iniciar sesion para modificar favoritos.");
      return;
    }

    const previousFavorites = favorites;
    setActionError(null);
    setFavorites((currentFavorites) =>
      currentFavorites.filter((favorite) => favorite.id !== offer.id)
    );

    try {
      await removeFavorite(session.token, offer.id);
    } catch {
      setFavorites(previousFavorites);
      setActionError(
        "No pudimos quitar este favorito. Intenta de nuevo en unos segundos."
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

      <Text style={styles.title}>Favoritos</Text>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar favoritos" description={error} />
      ) : favorites.length === 0 ? (
        <EmptyState
          description="Guarda ofertas con el corazon para encontrarlas rapido."
          title="Todavia no agregaste favoritos."
        />
      ) : (
        <View style={styles.list}>
          {actionError ? (
            <Text style={styles.actionError}>{actionError}</Text>
          ) : null}
          {favorites.map((offer) => (
            <OfferCard
              isFavorite
              key={offer.id}
              offer={offer}
              onFavoritePress={() => {
                void handleRemoveFavorite(offer);
              }}
              onPress={() => router.push(`/(client)/offer/${offer.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  actionError: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  content: {
    gap: spacing.lg
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
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900"
  }
  });
}
