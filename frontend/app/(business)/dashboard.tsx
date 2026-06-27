import { useRouter } from "expo-router";
import { PackageCheck, PlusCircle, ReceiptText } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AdminMetricCard } from "../../src/components/AdminMetricCard";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StatusBadge } from "../../src/components/StatusBadge";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { getOffers } from "../../src/services/offerService";
import { getReservations } from "../../src/services/reservationService";
import type { Offer } from "../../src/types/offer";
import type { Reservation } from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!session) {
        return;
      }

      try {
        const [nextOffers, nextReservations] = await Promise.all([
          getOffers(),
          getReservations(session.token)
        ]);
        setOffers(
          nextOffers.filter(
            (offer) => offer.businessId === session.user.businessId
          )
        );
        setReservations(nextReservations);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [session]);

  const completedRevenue = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.status === "picked_up")
        .reduce((total, reservation) => total + reservation.totalPrice, 0),
    [reservations]
  );

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <ScreenContainer>
      <Header
        rightAction={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        }
        subtitle={`Hola, ${session?.user.name ?? "comercio"}`}
        title="Panel Local"
      />

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando inicio...</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <AdminMetricCard
              accent="secondary"
              icon={<PackageCheck color={colors.secondary} size={20} />}
              label="Ofertas Activas"
              value={String(offers.length)}
            />
            <AdminMetricCard
              accent="primary"
              icon={<ReceiptText color={colors.primary} size={20} />}
              label="Reservas Hoy"
              value={String(reservations.length)}
            />
          </View>

          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total cobrado</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(completedRevenue)}
            </Text>
          </View>

          <PrimaryButton
            icon={<PlusCircle color="#FFFFFF" size={20} />}
            label="PUBLICAR EXCEDENTE"
            onPress={() => undefined}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos recientes</Text>
            {reservations.slice(0, 3).map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <View style={styles.reservationTextBlock}>
                    <Text style={styles.reservationCode}>
                      {reservation.confirmationCode}
                    </Text>
                    <Text style={styles.reservationTitle}>
                      {reservation.offerTitle}
                    </Text>
                  </View>
                  <StatusBadge status={reservation.status} />
                </View>
                <Text style={styles.reservationMeta}>
                  {reservation.customerName} · {reservation.pickupTime}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: 14
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  logoutText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  reservationCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  reservationCode: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  reservationHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  reservationMeta: {
    color: colors.mutedText,
    fontSize: 13
  },
  reservationTextBlock: {
    flex: 1,
    gap: spacing.xs
  },
  reservationTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  revenueCard: {
    backgroundColor: colors.text,
    borderRadius: radii.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  revenueLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.82
  },
  revenueValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900"
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.lg
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  }
});
