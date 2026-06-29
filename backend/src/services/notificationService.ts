import {
  createNotification,
  listNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow
} from "./repository.js";

type NotificationType = "reservation_created" | "reservation_expired" | "payment_confirmed" | "pickup_reminder";

const templates: Record<NotificationType, { title: string; message: (code: string) => string }> = {
  reservation_created: {
    title: "Reserva creada",
    message: (code) => `Tu reserva #${code} fue creada. Tenés 15 minutos para avisar el pago.`
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

export async function getNotifications(userId: string) {
  return listNotificationsByUser(userId);
}

export async function markRead(id: string, userId: string) {
  return markNotificationRead(id, userId);
}

export async function markAllRead(userId: string) {
  return markAllNotificationsRead(userId);
}
