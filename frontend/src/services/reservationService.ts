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
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
  items?: Reservation[];
};

type GetReservationsOptions = {
  page?: number;
  limit?: number;
};

export type ReservationsPage = {
  items: Reservation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function getReservations(
  token: string,
  options: GetReservationsOptions = {}
) {
  const response = await apiRequest<ReservationsResponse>(
    buildReservationsPath(options),
    { token }
  );

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

export async function getReservationsPage(
  token: string,
  options: GetReservationsOptions = {}
): Promise<ReservationsPage> {
  const response = await apiRequest<ReservationsResponse>(
    buildReservationsPath(options),
    { token }
  );

  if (Array.isArray(response.reservations)) {
    return {
      items: response.reservations,
      limit: response.reservations.length,
      page: options.page ?? 1,
      total: response.reservations.length,
      totalPages: 1
    };
  }

  if (response.reservations && Array.isArray(response.reservations.items)) {
    return {
      items: response.reservations.items,
      limit: response.reservations.limit ?? options.limit ?? 20,
      page: response.reservations.page ?? options.page ?? 1,
      total: response.reservations.total ?? response.reservations.items.length,
      totalPages: response.reservations.totalPages ?? 1
    };
  }

  if (Array.isArray(response.items)) {
    return {
      items: response.items,
      limit: options.limit ?? response.items.length,
      page: options.page ?? 1,
      total: response.items.length,
      totalPages: 1
    };
  }

  return {
    items: [],
    limit: options.limit ?? 20,
    page: options.page ?? 1,
    total: 0,
    totalPages: 1
  };
}

function buildReservationsPath(options: GetReservationsOptions) {
  const queryParams = new URLSearchParams();

  if (options.page) {
    queryParams.set("page", String(options.page));
  }

  if (options.limit) {
    queryParams.set("limit", String(options.limit));
  }

  return queryParams.toString()
    ? `/reservations?${queryParams.toString()}`
    : "/reservations";
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
