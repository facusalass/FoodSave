import type { Reservation } from "../types/reservation.js";

export const mockReservations: Reservation[] = [
  {
    id: "reservation-1",
    offerId: "offer-1",
    businessId: "business-espiga",
    userId: "user-client-1",
    quantity: 1,
    totalPrice: 1500,
    confirmationCode: "#FS-A4B",
    status: "pending",
    createdAt: "2026-05-03T18:00:00.000Z"
  },
  {
    id: "reservation-2",
    offerId: "offer-2",
    businessId: "business-delicias",
    userId: "user-client-1",
    quantity: 1,
    totalPrice: 1200,
    confirmationCode: "#FS-C2D",
    status: "confirmed_paid",
    createdAt: "2026-05-02T16:30:00.000Z"
  },
  {
    id: "reservation-3",
    offerId: "offer-3",
    businessId: "business-rotiseria",
    userId: "user-client-1",
    quantity: 2,
    totalPrice: 4000,
    confirmationCode: "#FS-E8F",
    status: "picked_up",
    createdAt: "2026-04-15T19:00:00.000Z"
  },
  {
    id: "reservation-4",
    offerId: "offer-1",
    businessId: "business-espiga",
    userId: "user-client-1",
    quantity: 1,
    totalPrice: 1500,
    confirmationCode: "#FS-K9M",
    status: "cancelled",
    createdAt: "2026-05-01T10:15:00.000Z"
  }
];
