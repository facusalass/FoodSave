import { createNotification, deleteNotificationByUser, deleteNotificationsByUser, listNotificationsByUser, markAllNotificationsRead, markNotificationRead } from "./repository.js";
const templates = {
    reservation_created: {
        title: "Reserva creada",
        message: (code) => `Tu reserva #${code} fue creada. Tenés 25 minutos para avisar el pago.`
    },
    reservation_expired: {
        title: "Reserva expirada",
        message: (code) => `Tu reserva expiró porque no se confirmó el pago a tiempo.`
    },
    payment_confirmed: {
        title: "Pago confirmado",
        message: (code) => `El comercio confirmó tu pago. Tu reserva #${code} ya está confirmada.`
    },
    pickup_reminder: {
        title: "Recordatorio de retiro",
        message: (code) => `Recordá retirar tu pedido #${code} en el horario indicado.`
    },
    reservation_received: {
        title: "Nueva reserva",
        message: (code) => `Recibiste una nueva reserva #${code}. Confirmá el pago cuando el cliente te avise.`
    },
    payment_received: {
        title: "Pago confirmado",
        message: (code) => `Confirmaste el pago de la reserva #${code}.`
    }
};
async function send(notif) {
    return createNotification({ ...notif, createdAt: new Date().toISOString() });
}
export async function notifyReservationCreated(reservationId, userId, code) {
    const type = "reservation_created";
    await send({
        id: `${reservationId}-${type}`,
        userId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function notifyReservationExpired(reservationId, userId, code) {
    const type = "reservation_expired";
    await send({
        id: `${reservationId}-${type}`,
        userId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function notifyPaymentConfirmed(reservationId, userId, code) {
    const type = "payment_confirmed";
    await send({
        id: `${reservationId}-${type}`,
        userId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function notifyPickupReminder(reservationId, userId, code) {
    const type = "pickup_reminder";
    await send({
        id: `${reservationId}-${type}`,
        userId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function notifyBusinessReservationReceived(reservationId, businessOwnerId, code) {
    const type = "reservation_received";
    await send({
        id: `${reservationId}-${type}-biz`,
        userId: businessOwnerId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function notifyBusinessPaymentReceived(reservationId, businessOwnerId, code) {
    const type = "payment_received";
    await send({
        id: `${reservationId}-${type}-biz`,
        userId: businessOwnerId,
        type,
        title: templates[type].title,
        message: templates[type].message(code),
        reservationId,
        read: false
    });
}
export async function getNotifications(userId) {
    return listNotificationsByUser(userId);
}
export async function markRead(id, userId) {
    return markNotificationRead(id, userId);
}
export async function markAllRead(userId) {
    return markAllNotificationsRead(userId);
}
export async function deleteNotification(id, userId) {
    return deleteNotificationByUser(id, userId);
}
export async function deleteAllNotifications(userId) {
    return deleteNotificationsByUser(userId);
}
