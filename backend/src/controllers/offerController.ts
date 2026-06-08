import type { Request, Response } from "express";
import { findOfferById, listOffers } from "../services/offerService.js";

export function listOffersController(_request: Request, response: Response) {
  response.json({ offers: listOffers() });
}

export function getOfferController(request: Request, response: Response) {
  const offerId = request.params.id;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({ message: "ID de oferta inválido." });
    return;
  }

  const offer = findOfferById(offerId);

  if (!offer) {
    response.status(404).json({ message: "Oferta no encontrada." });
    return;
  }

  response.json({ offer });
}
