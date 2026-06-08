import { apiRequest } from "./apiClient";
import type {
  Reservation,
  ReservationStatus
} from "../types/reservation";

export async function getReservations(token: string) {
  const response = await apiRequest<{ reservations: Reservation[] }>(
    "/reservations",
    { token }
  );
  return response.reservations;
}

export async function updateReservationStatus(
  token: string,
  reservationId: string,
  status: ReservationStatus
) {
  const response = await apiRequest<{ reservation: Reservation }>(
    `/reservations/${reservationId}/status`,
    {
      body: JSON.stringify({ status }),
      method: "PATCH",
      token
    }
  );

  return response.reservation;
}
