import {
  addFavoriteRepo,
  findOfferById,
  listFavoritesByUser,
  removeFavoriteRepo
} from "./repository.js";
import { enrichOfferWithBusiness } from "./offerService.js";

export async function listFavorites(userId: string) {
  const favs = await listFavoritesByUser(userId);
  const results = [];

  for (const fav of favs) {
    const offer = await findOfferById(fav.offerId);
    if (offer) {
      results.push(await enrichOfferWithBusiness(offer));
    }
  }

  return results;
}

export async function addFavorite(
  userId: string,
  offerId: string
) {
  const offer = await findOfferById(offerId);
  if (!offer) {
    return { error: "Oferta no encontrada." as const };
  }

  await addFavoriteRepo(userId, offerId);
  return enrichOfferWithBusiness(offer);
}

export async function removeFavorite(userId: string, offerId: string) {
  return removeFavoriteRepo(userId, offerId);
}
