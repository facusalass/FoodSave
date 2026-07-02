import { createOfferRepo, deleteOfferById, findBusinessById, findOfferById, listOffersRepo, updateBusinessById, updateOfferById } from "./repository.js";
export async function enrichOfferWithBusiness(offer) {
    const business = await findBusinessById(offer.businessId);
    return {
        ...offer,
        businessClosingTime: business?.closingTime,
        storeName: business?.name ?? "Comercio no encontrado",
        storeAddress: business?.address ?? "",
        logoUrl: business?.logoUrl
    };
}
export async function listOffers(filters) {
    const paginated = await listOffersRepo(filters);
    const items = await Promise.all(paginated.items.map(enrichOfferWithBusiness));
    return { ...paginated, items };
}
export async function findOfferByIdPublic(id) {
    const offer = await findOfferById(id);
    if (!offer)
        return undefined;
    return enrichOfferWithBusiness(offer);
}
export async function createOffer(data, businessId) {
    const now = new Date().toISOString();
    const newOffer = {
        ...data,
        id: `offer-${Date.now()}`,
        businessId,
        isVisible: data.isVisible ?? true,
        createdAt: now
    };
    const created = await createOfferRepo(newOffer);
    return enrichOfferWithBusiness(created);
}
export async function updateOffer(id, businessId, data_update) {
    const updated = await updateOfferById(id, businessId, data_update);
    if (!updated)
        return null;
    return enrichOfferWithBusiness(updated);
}
export async function updateBusinessProfile(businessId, data_update) {
    return updateBusinessById(businessId, data_update);
}
export async function deleteOffer(id, businessId) {
    return deleteOfferById(id, businessId);
}
