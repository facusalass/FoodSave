import type { Offer } from "../types/offer";

export function getFavoriteIds(favorites: Offer[]) {
  return new Set(favorites.map((offer) => offer.id));
}

export function toggleFavoriteId(
  favoriteIds: Set<string>,
  offerId: string,
  shouldBeFavorite: boolean
) {
  const nextFavoriteIds = new Set(favoriteIds);

  if (shouldBeFavorite) {
    nextFavoriteIds.add(offerId);
  } else {
    nextFavoriteIds.delete(offerId);
  }

  return nextFavoriteIds;
}
