import { apiRequest } from "./apiClient";
import type {
  Reservation,
  ReservationStatus
} from "../types/reservation";

type ReservationsResponse = {
  reservations?:
    | Reservation[]
    | {
        items?: Reservation[];
      };
  items?: Reservation[];
};

export async function getReservations(token: string) {
  const response = await apiRequest<ReservationsResponse>("/reservations", {
    token
  });

  if (Array.isArray(response.reservations)) {
    return response.reservations;
  }

  if (Array.isArray(response.reservations?.items)) {
    return response.reservations.items;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}

export async function createReservation(
  token: string,
  offerId: string,
  quantity = 1
) {
  const response = await apiRequest<{ reservation: Reservation }>(
    "/reservations",
    {
      body: JSON.stringify({ offerId, quantity }),
      method: "POST",
      token
    }
  );

  return response.reservation;
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
