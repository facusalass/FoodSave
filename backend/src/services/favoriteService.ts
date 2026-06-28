import { mockFavorites } from "../data/favorites.js";
import { mockOffers } from "../data/offers.js";
import { listOffers } from "./offerService.js";
import type { OfferWithBusinessData } from "./offerService.js";

export function listFavorites(userId: string): OfferWithBusinessData[] {
  const favoriteOffers = mockFavorites
    .filter((fav) => fav.userId === userId)
    .map((fav) => fav.offerId);

  const enriched = listOffers();
  return enriched.filter((offer) => favoriteOffers.includes(offer.id));
}

export function addFavorite(
  userId: string,
  offerId: string
): OfferWithBusinessData | { error: string } {
  const offer = mockOffers.find((o) => o.id === offerId);
  if (!offer) {
    return { error: "Oferta no encontrada." };
  }

  const already = mockFavorites.find(
    (fav) => fav.userId === userId && fav.offerId === offerId
  );
  if (already) {
    const enriched = listOffers().find((o) => o.id === offerId);
    return enriched!;
  }

  mockFavorites.push({ userId, offerId });

  const enriched = listOffers().find((o) => o.id === offerId);
  return enriched!;
}

export function removeFavorite(userId: string, offerId: string): boolean {
  const index = mockFavorites.findIndex(
    (fav) => fav.userId === userId && fav.offerId === offerId
  );
  if (index === -1) return false;

  mockFavorites.splice(index, 1);
  return true;
}
