import { mockOffers } from "../data/offers.js";
import type { Offer } from "../types/offer.js";

export function listOffers(): Offer[] {
  return mockOffers;
}

export function findOfferById(id: string): Offer | undefined {
  return mockOffers.find((offer) => offer.id === id);
}
