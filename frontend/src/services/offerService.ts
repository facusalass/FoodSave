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

export type UpdateBusinessOfferPayload = Partial<CreateBusinessOfferPayload>;

export type BusinessProfilePayload = {
  name?: string;
  category?: string;
  description?: string;
  city?: string;
  address?: string;
  closingTime?: string;
  logoUrl?: string;
  paymentInfo?: {
    ownerName: string;
    cvu: string;
    alias: string;
  };
};

export type BusinessProfile = {
  id: string;
  name: string;
  ownerId: string;
  isActive?: boolean;
  category: string;
  description: string;
  city: string;
  address: string;
  closingTime: string;
  logoUrl?: string;
  paymentInfo?: {
    ownerName?: string;
    cvu?: string;
    alias?: string;
  };
  createdAt?: string;
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

export async function updateBusinessOffer(
  token: string,
  offerId: string,
  payload: UpdateBusinessOfferPayload
) {
  const response = await apiRequest<{ offer: Offer }>(
    `/business/offers/${offerId}`,
    {
      body: JSON.stringify(payload),
      method: "PUT",
      token
    }
  );

  return response.offer;
}

export async function getBusinessProfile(token: string) {
  const response = await apiRequest<{ business: BusinessProfile }>(
    "/business/profile",
    { token }
  );

  return response.business;
}

export async function getBusinessOffers(token: string) {
  const response = await apiRequest<{ offers: Offer[] }>("/business/offers", {
    token
  });

  return response.offers;
}

export async function updateBusinessProfile(
  token: string,
  payload: BusinessProfilePayload
) {
  const response = await apiRequest<{ business: BusinessProfile }>(
    "/business/profile",
    {
      body: JSON.stringify(payload),
      method: "PUT",
      token
    }
  );

  return response.business;
}

export async function updateBusinessOfferVisibility(
  token: string,
  offerId: string,
  isVisible: boolean
) {
  const response = await apiRequest<{ offer: Offer }>(
    `/business/offers/${offerId}/visibility`,
    {
      body: JSON.stringify({ isVisible }),
      method: "PATCH",
      token
    }
  );

  return response.offer;
}

export type UploadImagePayload = {
  name: string;
  type: string;
  uri: string;
};

export async function uploadImage(token: string, image: UploadImagePayload) {
  const formData = new FormData();
  formData.append(
    "file",
    {
      name: image.name,
      type: image.type,
      uri: image.uri
    } as unknown as Blob
  );

  const response = await apiRequest<{ url: string }>("/upload/image", {
    body: formData,
    method: "POST",
    token
  });

  return response.url;
}
