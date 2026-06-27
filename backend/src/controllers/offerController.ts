import type { Request, Response } from "express";
import { findOfferById, listOffers } from "../services/offerService.js";

export function listOffersController(_request: Request, response: Response) {
  const offers = listOffers();
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
