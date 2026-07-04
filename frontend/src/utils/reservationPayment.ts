import type { Reservation } from "../types/reservation";

const PAYMENT_FALLBACK = "No disponible";

function getValue(value?: string) {
  const cleanValue = value?.trim();
  return cleanValue ? cleanValue : PAYMENT_FALLBACK;
}

export function getReservationPaymentDetails(reservation: Reservation) {
  return {
    alias: getValue(
      reservation.paymentInfo?.alias ??
        reservation.paymentAlias ??
        reservation.bankAlias
    ),
    cvu: getValue(reservation.paymentInfo?.cvu),
    ownerName: getValue(reservation.paymentInfo?.ownerName)
  };
}
