import { mockOffers } from "../data/offers.js";
import { mockReservations } from "../data/reservations.js";
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
  const offer = mockOffers.find((candidate) => candidate.id === offerId);

  if (!offer) {
    return { error: "Oferta no encontrada" };
  }

  if (offer.stock < quantity) {
    return { error: "Stock insuficiente para realizar la reserva" };
  }

  offer.stock -= quantity;

  const now = new Date();
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    offerId: offer.id,
    businessId: offer.businessId,
    userId,
    storeName: offer.storeName,
    offerTitle: offer.title,
    confirmationCode: `#FS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    customerName: "Cliente FoodSave",
    customerPhone: "",
    pickupTime: offer.pickupLimit,
    status: "pending",
    date: now.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    month: now.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    }),
    address: offer.address,
    amount: offer.newPrice * quantity,
    quantity,
    totalPrice: offer.newPrice * quantity,
    createdAt: now.toISOString()
  };

  mockReservations.push(newReservation);
  return newReservation;
}
