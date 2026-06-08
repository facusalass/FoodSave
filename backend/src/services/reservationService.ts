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
