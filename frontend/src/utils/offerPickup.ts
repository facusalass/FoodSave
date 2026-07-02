import type { Offer } from "../types/offer";
import { formatClosingTimeDisplay, normalizeClosingTime } from "./closingTime";

export function getOfferPickupText(offer: Offer) {
  if (offer.pickupWindow) {
    return offer.pickupWindow;
  }

  if (offer.pickupLimit) {
    return `Retirar antes de las ${offer.pickupLimit}`;
  }

  const closingTime = normalizeClosingTime(
    offer.businessClosingTime ?? offer.closingTime
  );

  return closingTime
    ? `Retirar antes de las ${formatClosingTimeDisplay(closingTime)}`
    : "Consultar retiro";
}
