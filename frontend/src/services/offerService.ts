import { apiRequest } from "./apiClient";
import type { Offer } from "../types/offer";

type GetOffersOptions = {
  city?: string | null;
};

export async function getOffers(options: GetOffersOptions = {}) {
  const queryParams = new URLSearchParams();

  if (options.city) {
    queryParams.set("city", options.city);
  }

  const path = queryParams.toString()
    ? `/offers?${queryParams.toString()}`
    : "/offers";
  const response = await apiRequest<{ offers: Offer[] }>(path);
  return response.offers;
}

export async function getOfferById(id: string) {
  const response = await apiRequest<{ offer: Offer }>(`/offers/${id}`);
  return response.offer;
}
