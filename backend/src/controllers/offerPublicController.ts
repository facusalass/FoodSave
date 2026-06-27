import type { Request, Response } from "express";
import type { OfferType } from "../types/offer.js";
import { findOfferById, listOffers } from "../services/offerService.js";

export function listOffersController(request: Request, response: Response) {
  const { category, type } = request.query as {
    category?: string;
    type?: OfferType;
  };

  const offers = listOffers({ category, type });
  response.json({ success: true, data: { offers } });
}

export function getOfferController(request: Request, response: Response) {
  const offerId = request.params.id;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const offer = findOfferById(offerId);

  if (!offer) {
    response.status(404).json({
      success: false,
      error: { message: "Oferta no encontrada." }
    });
    return;
  }

  response.json({ success: true, data: { offer } });
}
