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

export function listOffers(): OfferWithBusinessData[] {
  return mockOffers.map(enrichOfferWithBusiness);
}

export function findOfferById(id: string): OfferWithBusinessData | undefined {
  const offer = mockOffers.find((offer) => offer.id === id);
  if (!offer) return undefined;
  return enrichOfferWithBusiness(offer);
}
