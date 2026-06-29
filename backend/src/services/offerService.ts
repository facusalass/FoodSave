import type { Offer } from "../types/offer.js";
import {
  createOfferRepo,
  deleteOfferById,
  findBusinessById,
  findOfferById,
  listOffersRepo,
  updateOfferById
} from "./repository.js";

export type OfferWithBusinessData = Offer & {
  storeName: string;
  storeAddress: string;
  logoUrl: string | undefined;
};

export async function enrichOfferWithBusiness(
  offer: Offer
): Promise<OfferWithBusinessData> {
  const business = await findBusinessById(offer.businessId);
  return {
    ...offer,
    storeName: business?.name ?? "Comercio no encontrado",
    storeAddress: business?.address ?? "",
    logoUrl: business?.logoUrl
  };
}

export async function listOffers(filters?: {
  category?: string;
  type?: string;
}): Promise<OfferWithBusinessData[]> {
  const offers = await listOffersRepo(filters);
  return Promise.all(offers.map(enrichOfferWithBusiness));
}

export async function findOfferByIdPublic(
  id: string
): Promise<OfferWithBusinessData | undefined> {
  const offer = await findOfferById(id);
  if (!offer) return undefined;
  return enrichOfferWithBusiness(offer);
}

export async function createOffer(
  data: Omit<Offer, "id" | "businessId" | "createdAt">,
  businessId: string
): Promise<OfferWithBusinessData> {
  const now = new Date().toISOString();
  const newOffer: Offer = {
    ...data,
    id: `offer-${Date.now()}`,
    businessId,
    createdAt: now
  };

  const created = await createOfferRepo(newOffer);
  return enrichOfferWithBusiness(created);
}

export async function updateOffer(
  id: string,
  businessId: string,
  data_update: Partial<
    Pick<Offer, "oldPrice" | "newPrice" | "stock" | "pickupWindow" | "pickupLimit">
  >
): Promise<OfferWithBusinessData | null> {
  const updated = await updateOfferById(id, businessId, data_update);
  if (!updated) return null;
  return enrichOfferWithBusiness(updated);
}

export async function deleteOffer(
  id: string,
  businessId: string
): Promise<boolean> {
  return deleteOfferById(id, businessId);
}
