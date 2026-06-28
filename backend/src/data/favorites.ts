export type FavoriteEntry = {
  userId: string;
  offerId: string;
};

export const mockFavorites: FavoriteEntry[] = [
  { userId: "user-client-1", offerId: "offer-1" },
  { userId: "user-client-1", offerId: "offer-3" }
];
