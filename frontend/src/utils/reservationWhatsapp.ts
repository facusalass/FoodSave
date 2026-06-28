import { Linking } from "react-native";
import type { Reservation } from "../types/reservation";
import { getReservationCode } from "./reservationStatus";

export function hasReservationWhatsapp(reservation: Reservation) {
  return Boolean(reservation.whatsappPhone?.replace(/\D/g, ""));
}

export async function openReservationWhatsapp(reservation: Reservation) {
  if (!hasReservationWhatsapp(reservation)) {
    throw new Error("Este comercio no tiene WhatsApp configurado.");
  }

  const phone = reservation.whatsappPhone?.replace(/\D/g, "");
  const code = getReservationCode(reservation);
  const message = encodeURIComponent(
    `Hola, soy cliente de FoodSave. Reserve la oferta ${reservation.offerTitle} en ${reservation.storeName}. Mi codigo de reserva es ${code}. Quiero avisar el pago.`
  );

  await Linking.openURL(`https://wa.me/${phone}?text=${message}`);
}
