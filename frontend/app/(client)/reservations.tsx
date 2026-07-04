import { useFocusEffect, useRouter } from "expo-router";
import { AlertTriangle, Check, ChevronDown } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getReservations,
  updateReservationStatus
} from "../../src/services/reservationService";
import type { Reservation } from "../../src/types/reservation";
import { openReservationWhatsapp } from "../../src/utils/reservationWhatsapp";

export default function ClientReservationsScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingReservationId, setCancellingReservationId] = useState<
    string | null
  >(null);
  const [reservationToCancel, setReservationToCancel] =
    useState<Reservation | null>(null);
  const [isMonthSelectorVisible, setIsMonthSelectorVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
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

  const monthOptions = useMemo(() => getMonthOptions(reservations), [
    reservations
  ]);

  useEffect(() => {
    if (selectedMonth && !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(null);
    }
  }, [monthOptions, selectedMonth]);

  const visibleMonth = useMemo(() => {
    if (selectedMonth) {
      return selectedMonth;
    }

    if (monthOptions.length > 1) {
      return "Todos los meses";
    }

    return monthOptions[0] ?? getCurrentMonthLabel();
  }, [monthOptions, selectedMonth]);

  const visibleReservations = useMemo(() => {
    if (!selectedMonth) {
      return reservations;
    }

    return reservations.filter(
      (reservation) => reservation.month === selectedMonth
    );
  }, [reservations, selectedMonth]);

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
          disabled={monthOptions.length === 0}
          onPress={() => setIsMonthSelectorVisible(true)}
          style={styles.monthButton}
        >
          <Text style={styles.monthText}>{visibleMonth}</Text>
          <ChevronDown color={theme.mutedText} size={18} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
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
          {visibleReservations.map((reservation) => (
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
      <MonthSelectorModal
        monthOptions={monthOptions}
        onClose={() => setIsMonthSelectorVisible(false)}
        onSelect={(month) => {
          setSelectedMonth(month);
          setIsMonthSelectorVisible(false);
        }}
        selectedMonth={selectedMonth}
        visible={isMonthSelectorVisible}
      />
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

function MonthSelectorModal({
  monthOptions,
  onClose,
  onSelect,
  selectedMonth,
  visible
}: {
  monthOptions: string[];
  onClose: () => void;
  onSelect: (month: string | null) => void;
  selectedMonth: string | null;
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
        <View style={styles.monthModalCard}>
          <Text style={styles.monthModalTitle}>Elegí un mes</Text>
          <Text style={styles.monthModalDescription}>
            Filtrá tus reservas por período.
          </Text>

          <View style={styles.monthOptions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSelect(null)}
              style={[
                styles.monthOption,
                selectedMonth === null ? styles.monthOptionSelected : null
              ]}
            >
              <Text style={styles.monthOptionText}>Todos los meses</Text>
              {selectedMonth === null ? (
                <Check color={theme.secondaryDark} size={18} />
              ) : null}
            </TouchableOpacity>

            {monthOptions.map((month) => {
              const isSelected = month === selectedMonth;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={month}
                  onPress={() => onSelect(month)}
                  style={[
                    styles.monthOption,
                    isSelected ? styles.monthOptionSelected : null
                  ]}
                >
                  <Text style={styles.monthOptionText}>{month}</Text>
                  {isSelected ? (
                    <Check color={theme.secondaryDark} size={18} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.monthModalCloseButton}
          >
            <Text style={styles.monthModalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
            <AlertTriangle color={theme.primary} size={23} />
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
                <ActivityIndicator color={theme.inverseText} size="small" />
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

function getMonthOptions(reservations: Reservation[]) {
  const seenMonths = new Set<string>();

  return reservations
    .map((reservation) => reservation.month)
    .filter((month): month is string => {
      if (!month || seenMonths.has(month)) {
        return false;
      }

      seenMonths.add(month);
      return true;
    });
}

function getCurrentMonthLabel() {
  const formattedValue = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric"
  }).format(new Date());
  const [month, year] = formattedValue.split(" de ");

  if (!month || !year) {
    return formattedValue;
  }

  return `${capitalize(month)} ${year}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    color: theme.mutedText,
    fontSize: 14
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  monthText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "600"
  },
  monthModalCard: {
    backgroundColor: theme.card,
    borderRadius: radii.lg,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    width: "88%"
  },
  monthModalCloseButton: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: radii.md,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  monthModalCloseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  monthModalDescription: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  monthModalTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900"
  },
  monthOption: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  monthOptionSelected: {
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}66`
  },
  monthOptionText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800"
  },
  monthOptions: {
    gap: spacing.sm
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  modalBackButton: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    flex: 0.85
  },
  modalBackText: {
    color: theme.text,
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
    backgroundColor: theme.card,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.lg
  },
  modalConfirmButton: {
    backgroundColor: theme.primary,
    flex: 1.3
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  modalDescription: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  modalIcon: {
    alignItems: "center",
    backgroundColor: `${theme.primary}1A`,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  modalMeta: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "600"
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: theme.overlay,
    flex: 1,
    justifyContent: "center"
  },
  modalStore: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  modalSummary: {
    backgroundColor: theme.subtleSurface,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  modalTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900"
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900"
  }
  });
}
