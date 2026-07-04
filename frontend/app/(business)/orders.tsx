import { useFocusEffect } from "expo-router";
import { CheckCircle2, Clock, Search, XCircle } from "lucide-react-native";
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
import { EmptyState } from "../../src/components/EmptyState";
import { BusinessMenuButton } from "../../src/components/business/BusinessSideMenu";
import { BusinessNotificationsButton } from "../../src/components/business/BusinessNotificationsButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getReservations,
  updateReservationStatus
} from "../../src/services/reservationService";
import type { Reservation, ReservationStatus } from "../../src/types/reservation";
import { formatCurrency } from "../../src/utils/formatCurrency";
import {
  formatRemainingTime,
  getReservationCode
} from "../../src/utils/reservationStatus";

type OrdersTab = "pending" | "confirmed";
type OrderAction = "cancel" | "confirm";
type OrderDialog =
  | { type: "cancel"; reservation: Reservation }
  | { message: string; title: string; type: "error" | "success" }
  | null;

const LOW_TIME_THRESHOLD_MS = 5 * 60 * 1000;
const TIMER_REFRESH_MS = 1000;

export default function BusinessOrdersScreen() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, TIMER_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, []);

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
          message: "El pedido quedo marcado como pagado y paso a Confirmados.",
          title: "Pago realizado",
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
        <Search color={theme.placeholder} size={18} />
        <TextInput
          autoCapitalize="characters"
          onChangeText={setSearchText}
          placeholder="Buscar por codigo (ej: FS-84A)"
          placeholderTextColor={theme.placeholder}
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
          <ActivityIndicator color={theme.primary} />
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
              currentTimestamp={currentTimestamp}
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
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
  currentTimestamp,
  onCancel,
  onConfirmPayment,
  reservation
}: {
  actionState: { id: string; type: OrderAction } | null;
  currentTimestamp: number;
  onCancel: (reservation: Reservation) => void;
  onConfirmPayment: (reservation: Reservation) => void;
  reservation: Reservation;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const remainingMilliseconds = getRemainingMillisecondsAt(
    reservation.expiresAt,
    currentTimestamp
  );
  const isLowTime =
    remainingMilliseconds !== null &&
    remainingMilliseconds > 0 &&
    remainingMilliseconds <= LOW_TIME_THRESHOLD_MS;
  const isExpired = remainingMilliseconds === 0;
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
            color={isLowTime || isExpired ? theme.danger : theme.mutedText}
            size={15}
          />
          <Text
            style={[
              styles.expireText,
              isLowTime || isExpired ? styles.expireTextDanger : null
            ]}
          >
            {isExpired
              ? "Expirado"
              : `Expira en: ${formatRemainingTime(remainingMilliseconds)} min`}
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
              <ActivityIndicator color={theme.text} />
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

function getRemainingMillisecondsAt(
  expiresAt: string | undefined,
  currentTimestamp: number
) {
  if (!expiresAt) {
    return null;
  }

  const expirationTimestamp = Date.parse(expiresAt);

  if (Number.isNaN(expirationTimestamp)) {
    return null;
  }

  return Math.max(expirationTimestamp - currentTimestamp, 0);
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
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
              <XCircle color={theme.danger} size={28} />
            ) : (
              <CheckCircle2 color={theme.secondaryDark} size={28} />
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
                  <ActivityIndicator color={theme.inverseText} />
                ) : (
                  <Text style={styles.dialogDangerText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.dialogPrimaryButton}
            >
              <Text style={styles.dialogPrimaryText}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButtonDisabled: {
    opacity: 0.72
  },
  cancelButton: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  code: {
    color: theme.mutedText,
    fontSize: 14,
    fontWeight: "800"
  },
  confirmButton: {
    backgroundColor: theme.primary
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  content: {
    gap: spacing.md,
    paddingBottom: 96
  },
  customerText: {
    color: theme.mutedText,
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
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    backgroundColor: theme.danger
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
    backgroundColor: `${theme.danger}1A`
  },
  dialogIconSuccess: {
    backgroundColor: `${theme.secondary}1A`
  },
  dialogMessage: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  dialogOverlay: {
    alignItems: "center",
    backgroundColor: theme.overlay,
    flex: 1,
    justifyContent: "center"
  },
  dialogPrimaryButton: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    width: "100%"
  },
  dialogPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  dialogSecondaryButton: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1
  },
  dialogSecondaryText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  dialogTitle: {
    color: theme.text,
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
    color: theme.text,
    fontSize: 13,
    fontWeight: "800"
  },
  expireTextDanger: {
    color: theme.danger
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
  notificationDot: {
    backgroundColor: theme.primary,
    borderColor: theme.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    position: "absolute",
    right: 10,
    top: 8,
    width: 9
  },
  offerTitle: {
    color: theme.mutedText,
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
    backgroundColor: theme.card,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: spacing.xs
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: theme.input,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    color: theme.text,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingVertical: 0
  },
  segment: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  segmentActive: {
    backgroundColor: theme.primary,
    elevation: 2,
    shadowColor: theme.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  segmentText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  statusBadge: {
    backgroundColor: `${theme.primary}1A`,
    borderColor: `${theme.primary}55`,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.header,
    borderBottomColor: theme.border,
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
    color: theme.text,
    fontSize: 17,
    fontWeight: "900"
  }
  });
}
