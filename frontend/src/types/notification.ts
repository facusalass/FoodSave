export type NotificationType =
  | "reservation_created"
  | "reservation_expired"
  | "payment_confirmed"
  | "pickup_reminder";

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
