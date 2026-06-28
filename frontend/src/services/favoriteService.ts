import { apiRequest } from "./apiClient";
import type { Offer } from "../types/offer";

export async function getFavorites(token: string) {
  const response = await apiRequest<{ favorites: Offer[] }>("/favorites", {
    token
  });

  return response.favorites;
}

export async function addFavorite(token: string, offerId: string) {
  const response = await apiRequest<{ favorite?: Offer; offer?: Offer }>(
    `/favorites/${offerId}`,
    {
      method: "POST",
      token
    }
  );

  return response.favorite ?? response.offer ?? null;
}

export async function removeFavorite(token: string, offerId: string) {
  await apiRequest<Record<string, never>>(`/favorites/${offerId}`, {
    method: "DELETE",
    token
  });
}
