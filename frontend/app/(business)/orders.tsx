import { useFocusEffect } from "expo-router";
import { CheckCircle2, Clock, Search, XCircle } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
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
import { EmptyState } from "../../src/components/EmptyState";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessNotificationsButton } from "../../src/components/business/BusinessNotificationsButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import {
  getReservations,
  updateReservationStatus
} from "../../src/services/reservationService";
import type { Reservation, ReservationStatus } from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";
import {
  formatRemainingTime,
  getRemainingMilliseconds,
  getReservationCode
} from "../../src/utils/reservationStatus";

type OrdersTab = "pending" | "confirmed";
type OrderAction = "cancel" | "confirm";
type OrderDialog =
  | { type: "cancel"; reservation: Reservation }
  | { message: string; title: string; type: "error" | "success" }
  | null;

const LOW_TIME_THRESHOLD_MS = 5 * 60 * 1000;

export default function BusinessOrdersScreen() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<OrdersTab>("pending");
  const [searchText, setSearchText] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{
    id: string;
    type: OrderAction;
  } | null>(null);
  const [dialog, setDialog] = useState<OrderDialog>(null);

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

  const pendingReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === "pending"),
    [reservations]
  );
  const confirmedReservations = useMemo(
    () =>
      reservations.filter(
        (reservation) => reservation.status === "confirmed_paid"
      ),
    [reservations]
  );

  const visibleReservations = useMemo(() => {
    const source =
      activeTab === "pending" ? pendingReservations : confirmedReservations;
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return source;
    }

    return source.filter((reservation) =>
      getReservationCode(reservation).toLowerCase().includes(normalizedSearch)
    );
  }, [activeTab, confirmedReservations, pendingReservations, searchText]);

  async function handleUpdateReservation(
    reservation: Reservation,
    status: ReservationStatus,
    action: OrderAction
  ) {
    if (!session || actionState) {
      return;
    }

    try {
      setActionState({ id: reservation.id, type: action });
      const updatedReservation = await updateReservationStatus(
        session.token,
        reservation.id,
        status
      );

      setReservations((currentReservations) =>
        currentReservations.map((currentReservation) =>
          currentReservation.id === updatedReservation.id
            ? updatedReservation
            : currentReservation
        )
      );

      if (status === "confirmed_paid") {
        setActiveTab("confirmed");
        setDialog({
          message: "El pedido paso a la lista de Confirmados.",
          title: "Pago confirmado",
          type: "success"
        });
      } else {
        setDialog({
          message: "El pedido fue cancelado y ya no aparece en activos.",
          title: "Pedido cancelado",
          type: "success"
        });
      }
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "No pudimos actualizar el pedido.";
      setDialog({
        message,
        title: "No pudimos actualizar",
        type: "error"
      });
    } finally {
      setActionState(null);
    }
  }

  function handleCancelReservation(reservation: Reservation) {
    setDialog({ reservation, type: "cancel" });
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <BusinessMenuButton />
        <Text style={styles.topBarTitle}>Pedidos Activos</Text>
        <BusinessNotificationsButton />
      </View>

      <View style={styles.searchBox}>
        <Search color="#94A3B8" size={18} />
        <TextInput
          autoCapitalize="characters"
          onChangeText={setSearchText}
          placeholder="Buscar por codigo (ej: FS-84A)"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchText}
        />
      </View>

      <View style={styles.tabsRow}>
        <TabButton
          count={pendingReservations.length}
          isActive={activeTab === "pending"}
          label="Pendientes"
          onPress={() => setActiveTab("pending")}
        />
        <TabButton
          count={confirmedReservations.length}
          isActive={activeTab === "confirmed"}
          label="Confirmados"
          onPress={() => setActiveTab("confirmed")}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : error ? (
        <EmptyState title="No pudimos cargar pedidos" description={error} />
      ) : visibleReservations.length === 0 ? (
        <EmptyState title="No hay pedidos para mostrar." />
      ) : (
        <View style={styles.list}>
          {visibleReservations.map((reservation) => (
            <OrderCard
              actionState={actionState}
              key={reservation.id}
              onCancel={handleCancelReservation}
              onConfirmPayment={(nextReservation) => {
                void handleUpdateReservation(
                  nextReservation,
                  "confirmed_paid",
                  "confirm"
                );
              }}
              reservation={reservation}
            />
          ))}
        </View>
      )}

      <OrderDialogModal
        dialog={dialog}
        isLoading={actionState?.type === "cancel"}
        onClose={() => setDialog(null)}
        onConfirmCancel={(reservation) => {
          setDialog(null);
          void handleUpdateReservation(reservation, "cancelled", "cancel");
        }}
      />
    </ScreenContainer>
  );
}

function TabButton({
  count,
  isActive,
  label,
  onPress
}: {
  count: number;
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.segment, isActive ? styles.segmentActive : null]}
    >
      <Text style={[styles.segmentText, isActive ? styles.segmentTextActive : null]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
}

function OrderCard({
  actionState,
  onCancel,
  onConfirmPayment,
  reservation
}: {
  actionState: { id: string; type: OrderAction } | null;
  onCancel: (reservation: Reservation) => void;
  onConfirmPayment: (reservation: Reservation) => void;
  reservation: Reservation;
}) {
  const remainingMilliseconds = getRemainingMilliseconds(reservation.expiresAt);
  const isLowTime =
    remainingMilliseconds !== null &&
    remainingMilliseconds > 0 &&
    remainingMilliseconds <= LOW_TIME_THRESHOLD_MS;
  const isPending = reservation.status === "pending";
  const isActionLoading = actionState?.id === reservation.id;
  const isCancelling = isActionLoading && actionState?.type === "cancel";
  const isConfirming = isActionLoading && actionState?.type === "confirm";

  return (
    <View style={styles.orderCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.code}>#{getReservationCode(reservation)}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {isPending ? "Pendiente" : "Confirmado"}
          </Text>
        </View>
      </View>

      <Text style={styles.price}>{formatCurrency(reservation.totalPrice)}</Text>
      <Text style={styles.offerTitle}>{reservation.offerTitle}</Text>

      {isPending && remainingMilliseconds !== null ? (
        <View style={styles.expireRow}>
          <Clock
            color={isLowTime ? colors.danger : colors.mutedText}
            size={15}
          />
          <Text style={[styles.expireText, isLowTime ? styles.expireTextDanger : null]}>
            Expira en: {formatRemainingTime(remainingMilliseconds)} min
          </Text>
        </View>
      ) : (
        <Text style={styles.customerText}>{reservation.customerName}</Text>
      )}

      {isPending ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isActionLoading}
            onPress={() => onCancel(reservation)}
            style={[
              styles.orderActionButton,
              styles.cancelButton,
              isActionLoading ? styles.actionButtonDisabled : null
            ]}
          >
            {isCancelling ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isActionLoading}
            onPress={() => onConfirmPayment(reservation)}
            style={[
              styles.orderActionButton,
              styles.confirmButton,
              isActionLoading ? styles.actionButtonDisabled : null
            ]}
          >
            {isConfirming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Pago</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function OrderDialogModal({
  dialog,
  isLoading,
  onClose,
  onConfirmCancel
}: {
  dialog: OrderDialog;
  isLoading: boolean;
  onClose: () => void;
  onConfirmCancel: (reservation: Reservation) => void;
}) {
  if (!dialog) {
    return null;
  }

  const isCancelDialog = dialog.type === "cancel";
  const isErrorDialog = dialog.type === "error";
  const title = isCancelDialog ? "Cancelar pedido" : dialog.title;
  const message = isCancelDialog
    ? `Vas a cancelar el pedido #${getReservationCode(dialog.reservation)}. Esta accion no se puede deshacer desde esta pantalla.`
    : dialog.message;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.dialogOverlay}>
        <Pressable style={styles.dialogBackdrop} onPress={onClose} />
        <View style={styles.dialogCard}>
          <View
            style={[
              styles.dialogIcon,
              isErrorDialog || isCancelDialog
                ? styles.dialogIconError
                : styles.dialogIconSuccess
            ]}
          >
            {isErrorDialog || isCancelDialog ? (
              <XCircle color={colors.danger} size={28} />
            ) : (
              <CheckCircle2 color={colors.secondaryDark} size={28} />
            )}
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>

          {isCancelDialog ? (
            <View style={styles.dialogActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={onClose}
                style={[styles.dialogButton, styles.dialogSecondaryButton]}
              >
                <Text style={styles.dialogSecondaryText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={() => onConfirmCancel(dialog.reservation)}
                style={[styles.dialogButton, styles.dialogDangerButton]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogDangerText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={[styles.dialogButton, styles.dialogPrimaryButton]}
            >
              <Text style={styles.dialogPrimaryText}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButtonDisabled: {
    opacity: 0.72
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderColor: "#D1D5DB",
    borderWidth: 1
  },
  cancelButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900"
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  code: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800"
  },
  confirmButton: {
    backgroundColor: colors.primary
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  content: {
    gap: spacing.md
  },
  customerText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.sm
  },
  dialogActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    width: "100%"
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  dialogButton: {
    alignItems: "center",
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  dialogCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 6,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    maxWidth: 360,
    padding: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    width: "88%"
  },
  dialogDangerButton: {
    backgroundColor: colors.danger
  },
  dialogDangerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  dialogIcon: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  dialogIconError: {
    backgroundColor: "#FEE2E2"
  },
  dialogIconSuccess: {
    backgroundColor: "#DCFCE7"
  },
  dialogMessage: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  dialogOverlay: {
    alignItems: "center",
    backgroundColor: "#0F172A66",
    flex: 1,
    justifyContent: "center"
  },
  dialogPrimaryButton: {
    backgroundColor: colors.primary,
    width: "100%"
  },
  dialogPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  dialogSecondaryButton: {
    backgroundColor: colors.card,
    borderColor: "#D1D5DB",
    borderWidth: 1
  },
  dialogSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  dialogTitle: {
    color: "#020617",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  expireRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md
  },
  expireText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  expireTextDanger: {
    color: colors.danger
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
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 10,
    top: 8,
    width: 9
  },
  offerTitle: {
    color: "#334155",
    fontSize: 14,
    marginTop: spacing.xs
  },
  orderActionButton: {
    alignItems: "center",
    borderRadius: radii.md,
    elevation: 2,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3
  },
  orderCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    padding: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5
  },
  price: {
    color: "#020617",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: spacing.xs
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#D1D5DB",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingVertical: 0
  },
  segment: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  segmentActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  segmentText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  statusBadge: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "800"
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  topBarButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  topBarTitle: {
    color: "#020617",
    fontSize: 17,
    fontWeight: "900"
  }
});
