import { mockOffers } from "../data/offers.js";
import { mockReservations } from "../data/reservations.js";
import { mockBusinesses, mockUsers } from "../data/users.js";
import type { PublicUser } from "../types/auth.js";
import type { Reservation, ReservationStatus } from "../types/reservation.js";
import type { Offer } from "../types/offer.js";

export type ReservationWithDetails = Reservation & {
  code: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  address: string;
  offerTitle: string;
  pickupTime: string;
  date: string;
  month: string;
  paymentAlias: string;
  bankAlias: string;
  whatsappPhone: string;
  paymentInfo: { cvu: string; alias: string };
};

const allowedStatuses: ReservationStatus[] = [
  "pending",
  "confirmed_paid",
  "picked_up",
  "cancelled"
];

function findOffer(offerId: string): Offer | undefined {
  return mockOffers.find((o) => o.id === offerId);
}

function normalizeReservationCode(reservation: Pick<Reservation, "code" | "confirmationCode">) {
  return (
    reservation.code ??
    reservation.confirmationCode.replace(/^#/, "") ??
    ""
  );
}

function generateReservationCode() {
  let code = "";

  do {
    code = `FS-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  } while (
    mockReservations.some(
      (reservation) => normalizeReservationCode(reservation) === code
    )
  );

  return code;
}

function enrichReservation(reservation: Reservation): ReservationWithDetails {
  const offer = findOffer(reservation.offerId);
  const business = mockBusinesses.find((b) => b.id === reservation.businessId);
  const user = mockUsers.find((u) => u.id === reservation.userId);
  const businessOwner = mockUsers.find((u) => u.id === business?.ownerId);
  const paymentAlias = business?.paymentInfo.alias ?? "";

  const createdAt = new Date(reservation.createdAt);

  return {
    ...reservation,
    code: normalizeReservationCode(reservation),
    customerName: user?.name ?? "Usuario no encontrado",
    customerPhone: user?.phone ?? "",
    storeName: business?.name ?? "Comercio no encontrado",
    address: business?.address ?? "",
    offerTitle: offer?.title ?? "Oferta no encontrada",
    pickupTime: offer?.pickupLimit ?? "",
    paymentAlias,
    bankAlias: paymentAlias,
    whatsappPhone: businessOwner?.phone ?? "",
    paymentInfo: business?.paymentInfo
      ? { cvu: business.paymentInfo.cvu, alias: business.paymentInfo.alias }
      : { cvu: "", alias: "" },
    date: createdAt.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    month: createdAt.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    })
  };
}

export function listReservationsForUser(user: PublicUser): ReservationWithDetails[] {
  let filtered: Reservation[];

  if (user.role === "business") {
    filtered = mockReservations.filter(
      (reservation) => reservation.businessId === user.businessId
    );
  } else {
    filtered = mockReservations.filter(
      (reservation) => reservation.userId === user.id
    );
  }

  return filtered.map(enrichReservation);
}

export function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  user: PublicUser
): ReservationWithDetails | null {
  if (!allowedStatuses.includes(status)) {
    return null;
  }

  const reservation = mockReservations.find(
    (candidate) => candidate.id === reservationId
  );

  if (!reservation) {
    return null;
  }

  if (user.role === "client") {
    if (
      status !== "cancelled" ||
      reservation.userId !== user.id ||
      reservation.status !== "pending"
    ) {
      return null;
    }

    reservation.status = status;
    return enrichReservation(reservation);
  }

  if (user.role !== "business" || reservation.businessId !== user.businessId) {
    return null;
  }

  reservation.status = status;
  return enrichReservation(reservation);
}

export function createReservation(
  offerId: string,
  userId: string,
  quantity: number
): ReservationWithDetails | { error: string } {
  const offer = findOffer(offerId);

  if (!offer) {
    return { error: "Oferta no encontrada" };
  }

  if (offer.stock < quantity) {
    return { error: "Stock insuficiente para realizar la reserva" };
  }

  offer.stock -= quantity;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const code = generateReservationCode();
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    offerId: offer.id,
    businessId: offer.businessId,
    userId,
    quantity,
    totalPrice: offer.newPrice * quantity,
    code,
    confirmationCode: `#${code}`,
    expiresAt: expiresAt.toISOString(),
    status: "pending",
    createdAt: now.toISOString()
  };

  mockReservations.push(newReservation);
  return enrichReservation(newReservation);
}
