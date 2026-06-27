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
  storeName: string;
  offerTitle: string;
  confirmationCode: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  status: ReservationStatus;
  date: string;
  month: string;
  address: string;
  paymentInfo?: {
    cvu: string;
    alias: string;
  };
};
