import { Clock, CreditCard, MapPin, MessageCircle, Package, XCircle } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { colors, radii, spacing } from "../constants/theme";
import type { Reservation } from "../types/reservation";
import {
  formatRemainingTime,
  getRemainingMilliseconds,
  getReservationCode,
  getReservationVisualState
} from "../utils/reservationStatus";
import { hasReservationWhatsapp } from "../utils/reservationWhatsapp";
import { StatusBadge } from "./StatusBadge";

type ReservationCardProps = {
  reservation: Reservation;
  isCancelling?: boolean;
  onCancelPress?: (reservation: Reservation) => void;
  onWhatsappPress?: (reservation: Reservation) => void;
};

export function ReservationCard({
  reservation,
  isCancelling = false,
  onCancelPress,
  onWhatsappPress
}: ReservationCardProps) {
  const [remainingMilliseconds, setRemainingMilliseconds] = useState(() =>
    getRemainingMilliseconds(reservation.expiresAt)
  );
  const visualState = getReservationVisualState(reservation);
  const reservationCode = getReservationCode(reservation);
  const isPendingPayment =
    reservation.status === "pending" && !visualState.isExpired;
  const paymentAlias =
    reservation.paymentAlias ??
    reservation.bankAlias ??
    reservation.paymentInfo?.alias ??
    "";
  const canOpenWhatsapp = isPendingPayment && hasReservationWhatsapp(reservation);

  useEffect(() => {
    if (reservation.status !== "pending" || !reservation.expiresAt) {
      return;
    }

    const updateRemainingTime = () => {
      setRemainingMilliseconds(getRemainingMilliseconds(reservation.expiresAt));
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [reservation.expiresAt, reservation.status]);

  const statusHint = getStatusHint({
    expiresAt: reservation.expiresAt,
    isExpired: visualState.isExpired,
    remainingMilliseconds,
    status: reservation.status
  });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Package color={colors.secondary} size={17} />
          <Text style={styles.dateText}>{reservation.date}</Text>
        </View>
        <StatusBadge
          label={visualState.badgeLabel}
          status={visualState.badgeStatus}
        />
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.store}>
          {reservation.storeName.toUpperCase()}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{reservation.offerTitle}</Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin color={colors.mutedText} size={17} />
          <Text numberOfLines={1} style={styles.metaText}>
            {reservation.address}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Clock color={colors.mutedText} size={17} />
            <Text style={styles.metaText}>Retiro: {reservation.pickupTime}</Text>
          </View>
          <Text style={styles.code}>#{reservationCode}</Text>
        </View>

        {statusHint ? <Text style={styles.statusHint}>{statusHint}</Text> : null}

        {isPendingPayment && paymentAlias ? (
          <View style={styles.paymentRow}>
            <CreditCard color={colors.secondaryDark} size={16} />
            <Text style={styles.paymentText}>Alias: {paymentAlias}</Text>
          </View>
        ) : null}

        {isPendingPayment ? (
          <View style={styles.actionsRow}>
            <ActionButton
              disabled={!canOpenWhatsapp}
              icon={<MessageCircle color={canOpenWhatsapp ? colors.secondaryDark : colors.mutedText} size={16} />}
              label="Avisar pago por WhatsApp"
              onPress={() => onWhatsappPress?.(reservation)}
              variant="whatsapp"
            />
            <ActionButton
              disabled={isCancelling || !onCancelPress}
              icon={
                isCancelling ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <XCircle color={colors.danger} size={16} />
                )
              }
              label={isCancelling ? "Cancelando..." : "Cancelar reserva"}
              onPress={() => onCancelPress?.(reservation)}
              variant="danger"
            />
          </View>
        ) : null}

        {isPendingPayment && !canOpenWhatsapp ? (
          <Text style={styles.helperText}>
            Este comercio no tiene WhatsApp configurado.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onPress,
  variant
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  variant: "danger" | "whatsapp";
}) {
  const isDanger = variant === "danger";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        isDanger ? styles.cancelButton : styles.whatsappButton,
        disabled ? styles.actionButtonDisabled : null
      ]}
    >
      {icon}
      <Text
        style={[
          styles.actionButtonText,
          isDanger ? styles.cancelButtonText : styles.whatsappButtonText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getStatusHint({
  expiresAt,
  isExpired,
  remainingMilliseconds,
  status
}: {
  expiresAt?: string;
  isExpired: boolean;
  remainingMilliseconds: number | null;
  status: Reservation["status"];
}) {
  if (status !== "pending" || !expiresAt) {
    return null;
  }

  if (isExpired) {
    return "El tiempo para confirmar esta reserva termino.";
  }

  if (remainingMilliseconds === null) {
    return null;
  }

  return `Tiempo para avisar el pago: ${formatRemainingTime(
    remainingMilliseconds
  )}`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#14B8A61A",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  body: {
    gap: spacing.sm,
    padding: spacing.md
  },
  actionButton: {
    alignItems: "center",
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  actionButtonDisabled: {
    opacity: 0.55
  },
  actionButtonText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cancelButton: {
    backgroundColor: "#EF44441A",
    borderColor: "#EF444455"
  },
  cancelButtonText: {
    color: colors.danger
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden"
  },
  code: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm
  },
  dateText: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 15
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm
  },
  metaText: {
    color: colors.mutedText,
    flexShrink: 1,
    fontSize: 14
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "700"
  },
  paymentRow: {
    alignItems: "center",
    backgroundColor: "#14B8A60F",
    borderColor: "#14B8A633",
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  paymentText: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs
  },
  statusHint: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "700"
  },
  store: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  topRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  whatsappButton: {
    backgroundColor: "#14B8A61A",
    borderColor: "#14B8A655"
  },
  whatsappButtonText: {
    color: colors.secondaryDark
  }
});
