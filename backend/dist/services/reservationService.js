import { notifyPaymentConfirmed, notifyPickupReminder, notifyReservationCreated, notifyReservationExpired, notifyBusinessReservationReceived, notifyBusinessPaymentReceived } from "./notificationService.js";
import { createReservationRepo, findBusinessById, findOfferById, findReservationById, findUserById, listReservationsByBusiness, listReservationsByUser, updateOfferById, updateReservationStatusById } from "./repository.js";
const allowedStatuses = ["pending", "confirmed_paid", "picked_up", "cancelled"];
function normalizeCode(r) {
    return r.code ?? r.confirmationCode?.replace(/^#/, "") ?? "";
}
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}
async function asyncFilter(arr, predicate) {
    return (await predicate()) ? arr : null;
}
async function fetchReservations(user, page, limit) {
    return user.role === "business" && user.businessId
        ? listReservationsByBusiness(user.businessId, page, limit)
        : listReservationsByUser(user.id, page, limit);
}
async function cancelReservationAndRestoreStock(reservation) {
    if (reservation.status === "cancelled") {
        return reservation;
    }
    const offer = await findOfferById(reservation.offerId);
    if (!offer)
        return null;
    const restoredOffer = await updateOfferById(reservation.offerId, reservation.businessId, {
        stock: offer.stock + reservation.quantity
    });
    if (!restoredOffer)
        return null;
    return updateReservationStatusById(reservation.id, "cancelled");
}
async function enrichReservation(reservation) {
    const [offer, business, user] = await Promise.all([
        findOfferById(reservation.offerId),
        findBusinessById(reservation.businessId),
        findUserById(reservation.userId)
    ]);
    const businessOwner = business?.ownerId ? await findUserById(business.ownerId) : null;
    const alias = business?.paymentInfo?.alias ?? "";
    return {
        ...reservation,
        code: normalizeCode(reservation),
        customerName: user?.name ?? "Usuario no encontrado",
        customerPhone: user?.phone ?? "",
        storeName: business?.name ?? "Comercio no encontrado",
        address: business?.address ?? "",
        offerTitle: offer?.title ?? "Oferta no encontrada",
        pickupTime: offer?.pickupLimit ?? "",
        paymentAlias: alias,
        bankAlias: alias,
        whatsappPhone: businessOwner?.phone ?? "",
        paymentInfo: business?.paymentInfo ? { ownerName: business.paymentInfo.ownerName, cvu: business.paymentInfo.cvu, alias: business.paymentInfo.alias } : { ownerName: "", cvu: "", alias: "" },
        date: formatDate(reservation.createdAt),
        month: new Date(reservation.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    };
}
export async function listReservationsForUser(user, page = 1, limit = 20) {
    let result = await fetchReservations(user, page, limit);
    const now = new Date();
    for (const r of result.items) {
        if (r.status === "pending" && r.expiresAt && new Date(r.expiresAt) < now) {
            const updated = await cancelReservationAndRestoreStock(r);
            if (updated)
                notifyReservationExpired(r.id, r.userId, normalizeCode(updated)).catch(() => { });
        }
    }
    if (result.items.some(r => r.status === "pending" && r.expiresAt && new Date(r.expiresAt) < now)) {
        result = await fetchReservations(user, page, limit);
    }
    const items = await Promise.all(result.items.map(enrichReservation));
    return { ...result, items };
}
export async function updateReservationStatus(reservationId, status, user) {
    if (!allowedStatuses.includes(status))
        return null;
    const reservation = await findReservationById(reservationId);
    if (!reservation)
        return null;
    if (reservation.status === "cancelled" && status !== "cancelled")
        return null;
    if (user.role === "client") {
        if (status !== "cancelled" || reservation.userId !== user.id || reservation.status !== "pending")
            return null;
        const updated = await cancelReservationAndRestoreStock(reservation);
        if (!updated)
            return null;
        return enrichReservation(updated);
    }
    if (user.role !== "business" || reservation.businessId !== user.businessId)
        return null;
    if (status === "cancelled") {
        const cancelled = await cancelReservationAndRestoreStock(reservation);
        if (!cancelled)
            return null;
        return enrichReservation(cancelled);
    }
    const updatedBusiness = await updateReservationStatusById(reservationId, status);
    if (!updatedBusiness)
        return null;
    if (status === "confirmed_paid") {
        const code = normalizeCode(updatedBusiness);
        notifyPaymentConfirmed(reservationId, updatedBusiness.userId, code).catch(() => { });
        notifyPickupReminder(reservationId, updatedBusiness.userId, code).catch(() => { });
        const biz = await findBusinessById(updatedBusiness.businessId);
        if (biz?.ownerId)
            notifyBusinessPaymentReceived(reservationId, biz.ownerId, code).catch(() => { });
    }
    return enrichReservation(updatedBusiness);
}
export async function createReservation(offerId, userId, quantity) {
    const offer = await findOfferById(offerId);
    if (!offer)
        return { error: "Oferta no encontrada" };
    if (offer.stock < quantity)
        return { error: "Stock insuficiente para realizar la reserva" };
    const updated = await updateOfferById(offerId, offer.businessId, { stock: offer.stock - quantity });
    if (!updated)
        return { error: "No se pudo actualizar el stock" };
    const now = new Date();
    const code = `FS-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const newReservation = {
        id: `res-${Date.now()}`,
        offerId: offer.id, businessId: offer.businessId, userId, quantity,
        totalPrice: offer.newPrice * quantity, code,
        confirmationCode: `#${code}`,
        expiresAt: new Date(now.getTime() + 25 * 60 * 1000).toISOString(),
        status: "pending", createdAt: now.toISOString()
    };
    const created = await createReservationRepo(newReservation);
    if (!created)
        return { error: "No se pudo crear la reserva." };
    notifyReservationCreated(created.id, userId, code).catch(() => { });
    const biz = await findBusinessById(offer.businessId);
    if (biz?.ownerId)
        notifyBusinessReservationReceived(created.id, biz.ownerId, code).catch(() => { });
    return enrichReservation(created);
}
