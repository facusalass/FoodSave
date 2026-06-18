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
  confirmationCode: string;
  status: ReservationStatus; 
  createdAt: string;   
};