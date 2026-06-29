import type { PublicUser } from "../types/auth.js";
import type { Reservation, ReservationStatus } from "../types/reservation.js";
import {
  createReservationRepo,
  findBusinessById,
  findOfferById,
  findReservationById,
  findUserById,
  listReservationsByBusiness,
  listReservationsByUser,
  updateOfferById,
  updateReservationStatusById
} from "./repository.js";

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

function normalizeReservationCode(
  reservation: Pick<Reservation, "code" | "confirmationCode">
) {
  return reservation.code ?? reservation.confirmationCode?.replace(/^#/, "") ?? "";
}

async function enrichReservation(
  reservation: Reservation
): Promise<ReservationWithDetails> {
  const offer = await findOfferById(reservation.offerId);
  const business = await findBusinessById(reservation.businessId);
  const user = await findUserById(reservation.userId);
  const businessOwner = business?.ownerId
    ? await findUserById(business.ownerId)
    : null;
  const paymentAlias = business?.paymentInfo?.alias ?? "";

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

export async function listReservationsForUser(
  user: PublicUser
): Promise<ReservationWithDetails[]> {
  let reservations: Reservation[];

  if (user.role === "business" && user.businessId) {
    reservations = await listReservationsByBusiness(user.businessId);
  } else {
    reservations = await listReservationsByUser(user.id);
  }

  return Promise.all(reservations.map(enrichReservation));
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  user: PublicUser
): Promise<ReservationWithDetails | null> {
  if (!allowedStatuses.includes(status)) {
    return null;
  }

  const reservation = await findReservationById(reservationId);
  if (!reservation) return null;

  if (user.role === "client") {
    if (
      status !== "cancelled" ||
      reservation.userId !== user.id ||
      reservation.status !== "pending"
    ) {
      return null;
    }

    const updated = await updateReservationStatusById(reservationId, status);
    return enrichReservation(updated);
  }

  if (user.role !== "business" || reservation.businessId !== user.businessId) {
    return null;
  }

  const updated = await updateReservationStatusById(reservationId, status);
  return enrichReservation(updated);
}

export async function createReservation(
  offerId: string,
  userId: string,
  quantity: number
): Promise<ReservationWithDetails | { error: string }> {
  const offer = await findOfferById(offerId);

  if (!offer) {
    return { error: "Oferta no encontrada" };
  }

  if (offer.stock < quantity) {
    return { error: "Stock insuficiente para realizar la reserva" };
  }

  // Decrementar stock
  const updated = await updateOfferById(offerId, offer.businessId, {
    stock: offer.stock - quantity
  });
  if (!updated) {
    return { error: "No se pudo actualizar el stock" };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const code = `FS-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

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

  const created = await createReservationRepo(newReservation);
  return enrichReservation(created);
}
