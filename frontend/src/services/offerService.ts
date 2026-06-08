import { apiRequest } from "./apiClient";
import type { Offer } from "../types/offer";

export async function getOffers() {
  const response = await apiRequest<{ offers: Offer[] }>("/offers");
  return response.offers;
}

export async function getOfferById(id: string) {
  const response = await apiRequest<{ offer: Offer }>(`/offers/${id}`);
  return response.offer;
}
