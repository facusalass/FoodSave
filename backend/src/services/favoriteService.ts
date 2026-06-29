import {
  addFavoriteRepo,
  findOfferById,
  listFavoritesByUser,
  removeFavoriteRepo
} from "./repository.js";
import { enrichOfferWithBusiness } from "./offerService.js";

export async function listFavorites(userId: string) {
  const favs = await listFavoritesByUser(userId);
  const offers = await Promise.all(favs.map((f) => findOfferById(f.offerId)));
  const valid = offers.filter((o): o is NonNullable<typeof o> => o !== null);
  const enriched = await Promise.all(valid.map((o) => enrichOfferWithBusiness(o)));
  return enriched;
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
