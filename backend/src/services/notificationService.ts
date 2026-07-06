import {
  createNotification,
  deleteNotificationByUser,
  deleteNotificationsByUser,
  listNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow
} from "./repository.js";

type NotificationType = "reservation_created" | "reservation_expired" | "payment_confirmed" | "pickup_reminder" | "reservation_received" | "payment_received";

const templates: Record<NotificationType, { title: string; message: (code: string) => string }> = {
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

async function send(notif: Omit<NotificationRow, "createdAt">) {
  return createNotification({ ...notif, createdAt: new Date().toISOString() });
}

export async function notifyReservationCreated(reservationId: string, userId: string, code: string) {
  const type = "reservation_created" as const;
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

export async function notifyReservationExpired(reservationId: string, userId: string, code: string) {
  const type = "reservation_expired" as const;
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

export async function notifyPaymentConfirmed(reservationId: string, userId: string, code: string) {
  const type = "payment_confirmed" as const;
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

export async function notifyPickupReminder(reservationId: string, userId: string, code: string) {
  const type = "pickup_reminder" as const;
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

export async function notifyBusinessReservationReceived(reservationId: string, businessOwnerId: string, code: string) {
  const type = "reservation_received" as const;
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

export async function notifyBusinessPaymentReceived(reservationId: string, businessOwnerId: string, code: string) {
  const type = "payment_received" as const;
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

export async function getNotifications(userId: string) {
  return listNotificationsByUser(userId);
}

export async function markRead(id: string, userId: string) {
  return markNotificationRead(id, userId);
}

export async function markAllRead(userId: string) {
  return markAllNotificationsRead(userId);
}

export async function deleteNotification(id: string, userId: string) {
  return deleteNotificationByUser(id, userId);
}

export async function deleteAllNotifications(userId: string) {
  return deleteNotificationsByUser(userId);
}
