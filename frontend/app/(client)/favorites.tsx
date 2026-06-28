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
import { colors, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import {
  getFavorites,
  removeFavorite
} from "../../src/services/favoriteService";
import type { Offer } from "../../src/types/offer";

export default function ClientFavoritesScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
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
      setError(
        "No pudimos cargar tus favoritos por ahora. Cuando el backend conecte /favorites, van a aparecer aca."
      );
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
        "No pudimos quitar este favorito. Intentá de nuevo cuando el backend esté listo."
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
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar favoritos" description={error} />
      ) : favorites.length === 0 ? (
        <EmptyState
          description="Guardá ofertas con el corazón para encontrarlas rápido."
          title="Todavía no agregaste favoritos."
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

const styles = StyleSheet.create({
  actionError: {
    color: colors.danger,
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
    color: colors.mutedText,
    fontSize: 14
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  }
});
