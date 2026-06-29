import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { Reservation } from "../types/reservation";
import {
  getRemainingMilliseconds,
  getReservationCode
} from "./reservationStatus";

export type InternalNotificationType =
  | "reservation_created"
  | "payment_confirmed"
  | "reservation_expired"
  | "pickup_reminder"
  | "favorite_offer";

export type InternalNotification = {
  id: string;
  type: InternalNotificationType;
  title: string;
  message: string;
  createdAt?: string;
  reservationId?: string;
  isRead: boolean;
};

type InternalNotificationDraft = Omit<InternalNotification, "isRead">;

const READ_NOTIFICATION_IDS_PREFIX = "foodsave.notifications.readIds.";

export function buildInternalNotifications(
  reservations: Reservation[],
  readIds: Set<string>
) {
  return reservations
    .flatMap((reservation) => buildReservationNotificationList(reservation))
    .map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id)
    }))
    .sort((firstNotification, secondNotification) => {
      return (
        getNotificationTimestamp(secondNotification) -
        getNotificationTimestamp(firstNotification)
      );
    });
}

export async function loadReadNotificationIds(userId: string) {
  const rawValue = await readValue(getReadNotificationIdsKey(userId));

  if (!rawValue) {
    return new Set<string>();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set<string>();
    }

    return new Set(
      parsedValue.filter((candidate): candidate is string => {
        return typeof candidate === "string";
      })
    );
  } catch {
    return new Set<string>();
  }
}

export async function saveReadNotificationIds(
  userId: string,
  readIds: Set<string>
) {
  await writeValue(
    getReadNotificationIdsKey(userId),
    JSON.stringify(Array.from(readIds))
  );
}

function buildReservationNotificationList(
  reservation: Reservation
): InternalNotificationDraft[] {
  const code = getReservationCode(reservation);
  const createdAt = reservation.createdAt ?? reservation.expiresAt;
  const isExpired =
    reservation.status === "pending" &&
    getRemainingMilliseconds(reservation.expiresAt) === 0;

  if (isExpired) {
    return [
      {
        createdAt: reservation.expiresAt ?? createdAt,
        id: `${reservation.id}:reservation_expired`,
        message:
          "Tu reserva expiró porque no se confirmó el pago a tiempo.",
        reservationId: reservation.id,
        title: "Reserva expirada",
        type: "reservation_expired" as const
      }
    ];
  }

  if (reservation.status === "pending") {
    return [
      {
        createdAt,
        id: `${reservation.id}:reservation_created`,
        message: `Tu reserva #${code} fue creada. Tenés 15 minutos para avisar el pago.`,
        reservationId: reservation.id,
        title: "Reserva creada",
        type: "reservation_created" as const
      }
    ];
  }

  if (reservation.status === "confirmed_paid") {
    const notifications: InternalNotificationDraft[] = [
      {
        createdAt,
        id: `${reservation.id}:payment_confirmed`,
        message:
          "El comercio confirmó tu pago. Tu reserva ya está confirmada.",
        reservationId: reservation.id,
        title: "Pago confirmado",
        type: "payment_confirmed" as const
      }
    ];

    if (reservation.pickupTime) {
      notifications.push({
        createdAt,
        id: `${reservation.id}:pickup_reminder`,
        message: "Recordá retirar tu pedido en el horario indicado.",
        reservationId: reservation.id,
        title: "Recordatorio de retiro",
        type: "pickup_reminder" as const
      });
    }

    return notifications;
  }

  return [];
}

function getNotificationTimestamp(
  notification: Pick<InternalNotification, "createdAt">
) {
  if (!notification.createdAt) {
    return 0;
  }

  const timestamp = Date.parse(notification.createdAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getReadNotificationIdsKey(userId: string) {
  return `${READ_NOTIFICATION_IDS_PREFIX}${userId}`;
}

async function readValue(key: string) {
  if (Platform.OS === "web" && globalThis.localStorage) {
    return globalThis.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string) {
  if (Platform.OS === "web" && globalThis.localStorage) {
    globalThis.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
