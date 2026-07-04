import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Clock, CreditCard, MessageCircle } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { EmptyState } from "../../src/components/EmptyState";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StatusBadge } from "../../src/components/StatusBadge";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getReservations } from "../../src/services/reservationService";
import type { Reservation } from "../../src/types/reservation";
import {
  formatRemainingTime,
  getRemainingMilliseconds,
  getReservationCode,
  getReservationVisualState
} from "../../src/utils/reservationStatus";
import {
  hasReservationWhatsapp,
  openReservationWhatsapp
} from "../../src/utils/reservationWhatsapp";

export default function ReservationConfirmedScreen() {
  const router = useRouter();
  const { reservationId } = useLocalSearchParams<{ reservationId?: string }>();
  const { logout, session } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [remainingMilliseconds, setRemainingMilliseconds] = useState<
    number | null
  >(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const loadReservation = useCallback(async () => {
    if (!session) {
      setError("Necesitas iniciar sesion para ver esta reserva.");
      setIsLoading(false);
      return;
    }

    if (!reservationId) {
      setError("No encontramos el codigo de la reserva.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const reservations = await getReservations(session.token);
      const nextReservation =
        reservations.find((candidate) => candidate.id === reservationId) ?? null;

      if (!nextReservation) {
        setError("No encontramos esta reserva en tu cuenta.");
      }

      setReservation(nextReservation);
      setRemainingMilliseconds(
        getRemainingMilliseconds(nextReservation?.expiresAt)
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar la reserva.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, session]);

  useFocusEffect(
    useCallback(() => {
      void loadReservation();
    }, [loadReservation])
  );

  useEffect(() => {
    if (!reservation?.expiresAt || reservation.status !== "pending") {
      return;
    }

    const updateRemainingTime = () => {
      setRemainingMilliseconds(getRemainingMilliseconds(reservation.expiresAt));
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [reservation?.expiresAt, reservation?.status]);

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  async function handleWhatsappPress() {
    if (!reservation || !hasReservationWhatsapp(reservation)) {
      setWhatsappError("Este comercio no tiene WhatsApp configurado.");
      return;
    }

    try {
      setWhatsappError(null);
      await openReservationWhatsapp(reservation);
    } catch (whatsappOpenError) {
      const message =
        whatsappOpenError instanceof Error
          ? whatsappOpenError.message
          : "No pudimos abrir WhatsApp en este dispositivo.";
      setWhatsappError(message);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.metaText}>Cargando reserva...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!reservation || error) {
    return (
      <ScreenContainer>
        <EmptyState
          description={error ?? "No pudimos cargar la reserva creada."}
          title="Reserva no encontrada"
        />
        <PrimaryButton
          label="IR A MIS RESERVAS"
          onPress={() => router.replace("/(client)/reservations")}
          variant="outline"
        />
      </ScreenContainer>
    );
  }

  const visualState = getReservationVisualState(reservation);
  const code = getReservationCode(reservation);
  const paymentAlias =
    reservation.paymentAlias ??
    reservation.bankAlias ??
    reservation.paymentInfo?.alias ??
    "";
  const isWhatsappDisabled =
    visualState.isExpired || !hasReservationWhatsapp(reservation);

  return (
    <ScreenContainer contentStyle={styles.content}>
      <ClientTopBar onMenuPress={() => setIsMenuVisible(true)} />
      <ClientSideMenu
        onClose={() => setIsMenuVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        visible={isMenuVisible}
      />

      <View style={styles.header}>
        <Text style={styles.title}>RESERVA CREADA</Text>
        <StatusBadge
          label={visualState.badgeLabel}
          status={visualState.badgeStatus}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.store}>{reservation.storeName.toUpperCase()}</Text>
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>{reservation.offerTitle}</Text>
        </View>

        <View style={styles.separator} />
        <Text style={styles.code}>#{code}</Text>
        <View style={styles.separator} />

        <View style={styles.row}>
          <Clock color={theme.mutedText} size={18} />
          <Text style={styles.rowText}>
            Horario de retiro: {reservation.pickupTime}
          </Text>
        </View>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerTitle}>
          {visualState.isExpired
            ? "El tiempo para confirmar esta reserva termino."
            : "Tenes 15 minutos para avisar el pago."}
        </Text>
        {remainingMilliseconds !== null && !visualState.isExpired ? (
          <Text style={styles.timerText}>
            {formatRemainingTime(remainingMilliseconds)}
          </Text>
        ) : null}
      </View>

      <View style={styles.paymentCard}>
        <View style={styles.row}>
          <CreditCard color={theme.secondaryDark} size={18} />
          <Text style={styles.sectionTitle}>Datos bancarios</Text>
        </View>
        <Text style={styles.aliasText}>
          Alias: {paymentAlias || "No configurado"}
        </Text>
      </View>

      {hasReservationWhatsapp(reservation) ? null : (
        <Text style={styles.helperText}>
          Este comercio no tiene WhatsApp configurado.
        </Text>
      )}
      {whatsappError ? (
        <Text style={styles.errorText}>{whatsappError}</Text>
      ) : null}

      <PrimaryButton
        disabled={isWhatsappDisabled}
        icon={<MessageCircle color="#FFFFFF" size={18} />}
        label="AVISAR PAGO POR WHATSAPP"
        onPress={handleWhatsappPress}
      />
      <PrimaryButton
        label="IR A MIS RESERVAS"
        onPress={() => router.replace("/(client)/reservations")}
        variant="outline"
      />
    </ScreenContainer>
  );
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  aliasText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700"
  },
  code: {
    color: theme.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center"
  },
  content: {
    gap: spacing.lg
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    alignItems: "center",
    gap: spacing.sm
  },
  helperText: {
    color: theme.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  metaText: {
    color: theme.mutedText,
    fontSize: 14
  },
  offerBadge: {
    alignSelf: "center",
    backgroundColor: `${theme.secondary}1A`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  offerBadgeText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "800"
  },
  paymentCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  rowText: {
    color: theme.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  separator: {
    backgroundColor: theme.border,
    height: 1,
    width: "100%"
  },
  store: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  timerCard: {
    alignItems: "center",
    backgroundColor: `${theme.warning}1A`,
    borderColor: `${theme.warning}55`,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  timerText: {
    color: theme.warning,
    fontSize: 28,
    fontWeight: "900"
  },
  timerTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  }
  });
}
