import { useFocusEffect } from "expo-router";
import { Clock } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StatusBadge } from "../../src/components/StatusBadge";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { getReservations } from "../../src/services/reservationService";
import type { Reservation } from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";
import {
  formatRemainingTime,
  getRemainingMilliseconds,
  getReservationCode,
  getReservationVisualState
} from "../../src/utils/reservationStatus";

export default function BusinessOrdersScreen() {
  const { session } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
          : "No pudimos cargar los pedidos.";
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

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "pending"
  );
  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed_paid"
  );

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>PEDIDOS ACTIVOS</Text>
      </View>

      <View style={styles.tabsRow}>
        <View style={[styles.segment, styles.segmentActive]}>
          <Text style={[styles.segmentText, styles.segmentTextActive]}>
            PENDIENTES ({pendingReservations.length})
          </Text>
        </View>
        <View style={styles.segment}>
          <Text style={styles.segmentText}>
            CONFIRMADOS ({confirmedReservations.length})
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar pedidos" description={error} />
      ) : reservations.length === 0 ? (
        <EmptyState title="Todavía no hay pedidos para este local." />
      ) : (
        <View style={styles.list}>
          {reservations.map((reservation) => (
            <OrderCard key={reservation.id} reservation={reservation} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function OrderCard({ reservation }: { reservation: Reservation }) {
  const visualState = getReservationVisualState(reservation);
  const remainingMilliseconds = getRemainingMilliseconds(reservation.expiresAt);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.code}>#{getReservationCode(reservation)}</Text>
        <Text style={styles.price}>{formatCurrency(reservation.totalPrice)}</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.orderMetaRow}>
        <Text style={styles.offerTitle}>{reservation.offerTitle}</Text>
        <StatusBadge
          label={visualState.badgeLabel}
          status={visualState.badgeStatus}
        />
      </View>
      {reservation.status === "pending" && remainingMilliseconds !== null ? (
        <>
          <View style={styles.expireRow}>
            <Clock color={colors.mutedText} size={15} />
            <Text style={styles.expireText}>
              Expira en: {formatRemainingTime(remainingMilliseconds)} min
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Próximamente",
                  "La cancelación desde el panel comercio se va a completar en una próxima fase."
                )
              }
              style={[styles.orderActionButton, styles.cancelButton]}
            >
              <Text style={[styles.orderActionText, styles.cancelButtonText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Próximamente",
                  "La confirmación de pago desde el panel comercio se va a completar en una próxima fase."
                )
              }
              style={[styles.orderActionButton, styles.confirmButton]}
            >
              <Text style={styles.confirmButtonText}>Confirmar pago</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.customerText}>{reservation.customerName}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 2
  },
  content: {
    gap: spacing.md
  },
  customerText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  expireRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  expireText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "800"
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
  offerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  orderCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 5
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1
  },
  cancelButtonText: {
    color: colors.text
  },
  confirmButton: {
    backgroundColor: colors.primary
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  orderActionButton: {
    alignItems: "center",
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 120,
    paddingHorizontal: spacing.sm
  },
  orderActionText: {
    fontSize: 12,
    fontWeight: "900"
  },
  orderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  orderMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  price: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  segment: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  segmentText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  separator: {
    backgroundColor: colors.border,
    height: 1
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: "center",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  }
});
