import { apiRequest } from "./apiClient";
import type { Offer, OfferType } from "../types/offer";

type GetOffersOptions = {
  city?: string | null;
};

type PaginatedOffersResponse = {
  offers: Offer[] | {
    items?: Offer[];
  };
};

export type CreateBusinessOfferPayload = {
  title: string;
  description: string;
  category: string;
  type: OfferType;
  oldPrice: number;
  newPrice: number;
  stock: number;
  pickupWindow?: string;
  pickupLimit?: string;
  allergens?: string[];
  imageUrl?: string;
  estimatedWeightInKg?: number;
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

export async function createBusinessOffer(
  token: string,
  payload: CreateBusinessOfferPayload
) {
  const response = await apiRequest<{ offer: Offer }>("/business/offers", {
    body: JSON.stringify(payload),
    method: "POST",
    token
  });

  return response.offer;
}
