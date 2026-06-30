export const CLIENT_NOTIFICATION_TYPES = [
  "reservation_created",
  "reservation_expired",
  "payment_confirmed",
  "pickup_reminder"
] as const;

export const BUSINESS_NOTIFICATION_TYPES = [
  "reservation_received",
  "payment_received"
] as const;

export type ClientNotificationType = (typeof CLIENT_NOTIFICATION_TYPES)[number];
export type BusinessNotificationType =
  (typeof BUSINESS_NOTIFICATION_TYPES)[number];
export type NotificationType = ClientNotificationType | BusinessNotificationType;

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  reservationId?: string;
  read: boolean;
  createdAt: string;
};

export function isClientNotificationType(type: NotificationType) {
  return (CLIENT_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

export function isBusinessNotificationType(type: NotificationType) {
  return (BUSINESS_NOTIFICATION_TYPES as readonly string[]).includes(type);
}
