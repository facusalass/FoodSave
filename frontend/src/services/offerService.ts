import { apiRequest } from "./apiClient";
import type { Offer } from "../types/offer";

type GetOffersOptions = {
  city?: string | null;
};

type PaginatedOffersResponse = {
  offers: Offer[] | {
    items?: Offer[];
  };
};

export async function getOffers(options: GetOffersOptions = {}) {
  const queryParams = new URLSearchParams();

  if (options.city) {
    queryParams.set("city", options.city);
  }

  const path = queryParams.toString()
    ? `/offers?${queryParams.toString()}`
    : "/offers";
  const response = await apiRequest<PaginatedOffersResponse>(path);

  if (Array.isArray(response.offers)) {
    return response.offers;
  }

  return Array.isArray(response.offers.items) ? response.offers.items : [];
}

export async function getOfferById(id: string) {
  const response = await apiRequest<{ offer: Offer }>(`/offers/${id}`);
  return response.offer;
}
