export type ReservationStatus =
  | "pending"
  | "confirmed_paid"
  | "picked_up"
  | "cancelled";

export type Reservation = {
  id: string;
  offerId: string;
  businessId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  code?: string;
  confirmationCode: string;
  expiresAt?: string;
  status: ReservationStatus;
  createdAt: string;
};
