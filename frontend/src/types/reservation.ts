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
  storeName: string;
  offerTitle: string;
  confirmationCode: string;
  expiresAt?: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  status: ReservationStatus;
  date: string;
  month: string;
  address: string;
  paymentAlias?: string;
  bankAlias?: string;
  whatsappPhone?: string;
  paymentInfo?: {
    cvu: string;
    alias: string;
  };
};
