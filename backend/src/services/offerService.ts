import { mockOffers } from "../data/offers.js";
import { mockBusinesses } from "../data/users.js";
import type { Offer } from "../types/offer.js";

export type OfferWithBusinessData = Offer & {
  storeName: string;
  storeAddress: string;
  logoUrl: string | undefined;
};

function enrichOfferWithBusiness(offer: Offer): OfferWithBusinessData {
  const business = mockBusinesses.find((b) => b.id === offer.businessId);
  return {
    ...offer,
    storeName: business?.name ?? "Comercio no encontrado",
    storeAddress: business?.address ?? "",
    logoUrl: business?.logoUrl
  };
}

export function listOffers(filters?: {
  category?: string;
  type?: string;
}): OfferWithBusinessData[] {
  let filtered = mockOffers;

  if (filters?.category) {
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter((o) => o.category.toLowerCase().includes(cat));
  }

  if (filters?.type) {
    filtered = filtered.filter((o) => o.type === filters.type);
  }

  return filtered.map(enrichOfferWithBusiness);
}

export function findOfferById(id: string): OfferWithBusinessData | undefined {
  const offer = mockOffers.find((offer) => offer.id === id);
  if (!offer) return undefined;
  return enrichOfferWithBusiness(offer);
}

export function createOffer(
  data: Omit<Offer, "id" | "businessId" | "createdAt">,
  businessId: string
): OfferWithBusinessData {
  const now = new Date().toISOString();
  const newOffer: Offer = {
    ...data,
    id: `offer-${Date.now()}`,
    businessId,
    createdAt: now
  };

  mockOffers.push(newOffer);
  return enrichOfferWithBusiness(newOffer);
}

export function updateOffer(
  id: string,
  businessId: string,
  data: Partial<Pick<Offer, "oldPrice" | "newPrice" | "stock" | "pickupWindow" | "pickupLimit">>
): OfferWithBusinessData | null {
  const offer = mockOffers.find((o) => o.id === id && o.businessId === businessId);
  if (!offer) return null;

  Object.assign(offer, data);
  return enrichOfferWithBusiness(offer);
}

export function deleteOffer(id: string, businessId: string): boolean {
  const index = mockOffers.findIndex((o) => o.id === id && o.businessId === businessId);
  if (index === -1) return false;

  mockOffers.splice(index, 1);
  return true;
}
