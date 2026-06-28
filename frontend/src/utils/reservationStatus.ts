import type { Reservation, ReservationStatus } from "../types/reservation";

export type ReservationVisualState = {
  badgeLabel?: string;
  badgeStatus: ReservationStatus;
  isExpired: boolean;
};

export function getReservationCode(reservation: Reservation) {
  return reservation.code ?? reservation.confirmationCode.replace(/^#/, "");
}

export function getRemainingMilliseconds(expiresAt?: string) {
  if (!expiresAt) {
    return null;
  }

  const timestamp = Date.parse(expiresAt);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(timestamp - Date.now(), 0);
}

export function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(Math.ceil(milliseconds / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getReservationVisualState(
  reservation: Reservation
): ReservationVisualState {
  const remainingMilliseconds = getRemainingMilliseconds(reservation.expiresAt);
  const isExpired =
    reservation.status === "pending" && remainingMilliseconds !== null
      ? remainingMilliseconds <= 0
      : false;

  if (isExpired) {
    return {
      badgeLabel: "Expirada",
      badgeStatus: "cancelled",
      isExpired: true
    };
  }

  if (reservation.status === "pending") {
    return {
      badgeLabel: "Pendiente de pago",
      badgeStatus: "pending",
      isExpired: false
    };
  }

  return {
    badgeStatus: reservation.status,
    isExpired: false
  };
}
