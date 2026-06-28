import { useFocusEffect, useRouter } from "expo-router";
import { AlertTriangle, ChevronDown } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import {
  getReservations,
  updateReservationStatus
} from "../../src/services/reservationService";
import type { Reservation } from "../../src/types/reservation";
import { openReservationWhatsapp } from "../../src/utils/reservationWhatsapp";

export default function ClientReservationsScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingReservationId, setCancellingReservationId] = useState<
    string | null
  >(null);
  const [reservationToCancel, setReservationToCancel] =
    useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleWhatsappPress(reservation: Reservation) {
    try {
      setActionError(null);
      await openReservationWhatsapp(reservation);
    } catch (whatsappError) {
      const message =
        whatsappError instanceof Error
          ? whatsappError.message
          : "No pudimos abrir WhatsApp en este dispositivo.";
      setActionError(message);
    }
  }

  function handleCancelPress(reservation: Reservation) {
    setReservationToCancel(reservation);
  }

  async function cancelReservation(reservation: Reservation) {
    if (!session) {
      setActionError("Necesitas iniciar sesion para cancelar una reserva.");
      return;
    }

    try {
      setActionError(null);
      setCancellingReservationId(reservation.id);
      const updatedReservation = await updateReservationStatus(
        session.token,
        reservation.id,
        "cancelled"
      );
      setReservations((currentReservations) =>
        currentReservations.map((currentReservation) =>
          currentReservation.id === updatedReservation.id
            ? updatedReservation
            : currentReservation
        )
      );
      setReservationToCancel(null);
    } catch (cancelError) {
      const message =
        cancelError instanceof Error
          ? cancelError.message
          : "No pudimos cancelar la reserva.";
      setActionError(message);
    } finally {
      setCancellingReservationId(null);
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
          {actionError ? (
            <Text style={styles.actionError}>{actionError}</Text>
          ) : null}
          {reservations.map((reservation) => (
            <ReservationCard
              isCancelling={cancellingReservationId === reservation.id}
              key={reservation.id}
              onCancelPress={handleCancelPress}
              onWhatsappPress={handleWhatsappPress}
              reservation={reservation}
            />
          ))}
        </View>
      )}
      <CancelReservationModal
        isLoading={
          reservationToCancel
            ? cancellingReservationId === reservationToCancel.id
            : false
        }
        onCancel={() => setReservationToCancel(null)}
        onConfirm={() => {
          if (reservationToCancel) {
            void cancelReservation(reservationToCancel);
          }
        }}
        reservation={reservationToCancel}
      />
    </ScreenContainer>
  );
}

function CancelReservationModal({
  isLoading,
  onCancel,
  onConfirm,
  reservation
}: {
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  reservation: Reservation | null;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={Boolean(reservation)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <AlertTriangle color={colors.primary} size={23} />
          </View>

          <Text style={styles.modalTitle}>Cancelar reserva</Text>
          <Text style={styles.modalDescription}>
            Si cancelas esta reserva, se libera el cupo y vas a dejar de verla
            como pendiente de pago.
          </Text>

          {reservation ? (
            <View style={styles.modalSummary}>
              <Text numberOfLines={1} style={styles.modalStore}>
                {reservation.storeName}
              </Text>
              <Text numberOfLines={1} style={styles.modalMeta}>
                {reservation.offerTitle} - {reservation.confirmationCode}
              </Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={onCancel}
              style={[styles.modalButton, styles.modalBackButton]}
            >
              <Text style={styles.modalBackText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={onConfirm}
              style={[
                styles.modalButton,
                styles.modalConfirmButton,
                isLoading ? styles.modalButtonDisabled : null
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalConfirmText}>Cancelar reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  modalBackButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    flex: 0.85
  },
  modalBackText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  modalButton: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  modalButtonDisabled: {
    opacity: 0.7
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.lg
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
    flex: 1.3
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  modalDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  modalIcon: {
    alignItems: "center",
    backgroundColor: "#FF6B351A",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  modalMeta: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600"
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "#11182799",
    flex: 1,
    justifyContent: "center"
  },
  modalStore: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  modalSummary: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  }
});
