import { useFocusEffect, useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { EmptyState } from "../../src/components/EmptyState";
import { ReservationCard } from "../../src/components/ReservationCard";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { getReservations } from "../../src/services/reservationService";
import type { Reservation } from "../../src/types/reservation";

export default function ClientReservationsScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        const nextReservations = await getReservations(session.token);
        setReservations(nextReservations);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar tus reservas.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void loadReservations();
    }, [loadReservations])
  );

  const visibleMonth = useMemo(() => {
    return reservations[0]?.month ?? "Mayo 2026";
  }, [reservations]);

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

      <View style={styles.headerRow}>
        <Text style={styles.title}>Mis Reservas</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => undefined}
          style={styles.monthButton}
        >
          <Text style={styles.monthText}>{visibleMonth}</Text>
          <ChevronDown color={colors.mutedText} size={18} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar tus reservas" description={error} />
      ) : reservations.length === 0 ? (
        <EmptyState
          description="Cuando reserves una oferta, va a aparecer en esta lista."
          title="Todavia no tenes reservas"
        />
      ) : (
        <View style={styles.list}>
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
  monthButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  monthText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  }
});
