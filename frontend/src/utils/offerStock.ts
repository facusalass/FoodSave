import type { Offer } from "../types/offer";

export function isOfferOutOfStock(offer: Offer) {
  return offer.stock <= 0;
}

export function sortOffersByStock<T extends Offer>(offers: T[]) {
  return [...offers].sort((firstOffer, secondOffer) => {
    const firstOutOfStock = isOfferOutOfStock(firstOffer);
    const secondOutOfStock = isOfferOutOfStock(secondOffer);

    if (firstOutOfStock === secondOutOfStock) {
      return 0;
    }

    return firstOutOfStock ? 1 : -1;
  });
}
