import type { Request, Response } from "express";
import type { OfferType } from "../types/offer.js";
import { findOfferByIdPublic, listOffers } from "../services/offerService.js";

export async function listOffersController(request: Request, response: Response) {
  const { category, type, city } = request.query as {
    category?: string;
    type?: OfferType;
    city?: string;
  };

  const offers = await listOffers({ category, type, city });
  response.json({ success: true, data: { offers } });
}

export async function getOfferController(request: Request, response: Response) {
  const offerId = request.params.id;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const offer = await findOfferByIdPublic(offerId);

  if (!offer) {
    response.status(404).json({
      success: false,
      error: { message: "Oferta no encontrada." }
    });
    return;
  }

  response.json({ success: true, data: { offer } });
}
