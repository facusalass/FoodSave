import { mockReservations } from "../data/reservations.js";
import { mockOffers } from "../data/offers.js"; // Necesitamos las ofertas para ver el stock
import type { PublicUser } from "../types/auth.js";
import type {
  Reservation,
  ReservationStatus
} from "../types/reservation.js";

const allowedStatuses: ReservationStatus[] = [
  "pending",
  "confirmed_paid",
  "picked_up",
  "cancelled"
];

export function listReservationsForUser(user: PublicUser): Reservation[] {
  if (user.role === "business") {
    return mockReservations.filter(
      (reservation) => reservation.businessId === user.businessId
    );
  }

  return mockReservations.filter((reservation) => reservation.userId === user.id);
}

export function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  user: PublicUser
): Reservation | null {
  if (!allowedStatuses.includes(status)) {
    return null;
  }

  const reservation = mockReservations.find(
    (candidate) => candidate.id === reservationId
  );

  if (!reservation) {
    return null;
  }

  if (user.role !== "business" || reservation.businessId !== user.businessId) {
    return null;
  }

  reservation.status = status;
  return reservation;
}

export function createReservation(
  offerId: string,
  userId: string,
  quantity: number
): Reservation | { error: string } {
  // 1. Buscamos la oferta
  const offer = mockOffers.find((o) => o.id === offerId);

  if (!offer) {
    return { error: "Oferta no encontrada" };
  }

  // 2. Validación crítica de negocio: ¿Hay stock?
  if (offer.stock < quantity) {
    return { error: "Stock insuficiente para realizar la reserva" };
  }

  // 3. Transacción: Descontamos el stock
  offer.stock -= quantity;

  // 4. Armamos la reserva congelando el precio actual
  const newReservation: Reservation = {
    id: `res-${Date.now()}`, 
    offerId: offer.id,
    businessId: offer.businessId,
    userId: userId,
    quantity: quantity,
    totalPrice: offer.newPrice * quantity, // Precio histórico congelado
    confirmationCode: `#FS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`, // Ej: #FS-X9A2
    status: "pending",
    createdAt: new Date().toISOString()
  };

  mockReservations.push(newReservation);

  return newReservation;
}