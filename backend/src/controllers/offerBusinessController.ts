import type { Request, Response } from "express";
import { createOffer, deleteOffer, enrichOfferWithBusiness, updateOffer, updateBusinessProfile } from "../services/offerService.js";
import type { OfferType } from "../types/offer.js";
import { findBusinessById, listOffersByBusinessId, updateOfferById } from "../services/repository.js";

export async function createOfferController(request: Request, response: Response) {
  const {
    title,
    description,
    category,
    type,
    oldPrice,
    newPrice,
    stock,
    pickupWindow,
    pickupLimit,
    allergens,
    imageUrl,
    estimatedWeightInKg,
    isVisible
  } = request.body as {
    title?: string;
    description?: string;
    category?: string;
    type?: OfferType;
    oldPrice?: number;
    newPrice?: number;
    stock?: number;
    pickupWindow?: string;
    pickupLimit?: string;
    allergens?: string[];
    imageUrl?: string;
    estimatedWeightInKg?: number;
    isVisible?: boolean;
  };

  if (!title || !description || !category || !type || !oldPrice || !newPrice || stock === undefined) {
    response.status(400).json({
      success: false,
      error: { message: "Faltan campos requeridos: title, description, category, type, oldPrice, newPrice, stock." }
    });
    return;
  }

  if (type !== "mystery_box" && type !== "standard") {
    response.status(400).json({
      success: false,
      error: { message: "type debe ser 'mystery_box' o 'standard'." }
    });
    return;
  }

  const offer = await createOffer(
    {
      title,
      description,
      category,
      type,
      oldPrice,
      newPrice,
      stock,
      pickupWindow: pickupWindow ?? "",
      pickupLimit: pickupLimit ?? "",
      allergens: allergens ?? [],
      imageUrl: imageUrl ?? "",
      estimatedWeightInKg,
      isVisible: isVisible ?? true
    },
    request.user!.businessId!
  );

  response.status(201).json({ success: true, data: { offer } });
}

export async function updateOfferController(request: Request, response: Response) {
  const offerId = request.params.id;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const { title, description, category, type, oldPrice, newPrice, stock, pickupWindow, pickupLimit, allergens, imageUrl, estimatedWeightInKg } = request.body as {
    title?: string;
    description?: string;
    category?: string;
    type?: OfferType;
    oldPrice?: number;
    newPrice?: number;
    stock?: number;
    pickupWindow?: string;
    pickupLimit?: string;
    allergens?: string[];
    imageUrl?: string;
    estimatedWeightInKg?: number;
  };

  const offer = await updateOffer(offerId, request.user!.businessId!, {
    title, description, category, type, oldPrice, newPrice, stock,
    pickupWindow, pickupLimit, allergens, imageUrl, estimatedWeightInKg
  });

  if (!offer) {
    response.status(404).json({
      success: false,
      error: { message: "Oferta no encontrada o no pertenece a tu comercio." }
    });
    return;
  }

  response.json({ success: true, data: { offer } });
}

export async function deleteOfferController(request: Request, response: Response) {
  const offerId = request.params.id;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const deleted = await deleteOffer(offerId, request.user!.businessId!);

  if (!deleted) {
    response.status(404).json({
      success: false,
      error: { message: "Oferta no encontrada o no pertenece a tu comercio." }
    });
    return;
  }

  response.json({ success: true, data: { message: "Oferta eliminada." } });
}

export async function updateBusinessProfileController(request: Request, response: Response) {
  const { name, category, description, city, address, closingTime, logoUrl, paymentInfo } = request.body as {
    name?: string; category?: string; description?: string; city?: string; address?: string; closingTime?: string; logoUrl?: string;
    paymentInfo?: { ownerName: string; cvu: string; alias: string };
  };

  const updated = await updateBusinessProfile(request.user!.businessId!, {
    name, category, description, city, address, closingTime, logoUrl, paymentInfo
  });

  if (!updated) return fail(response, 404, "Comercio no encontrado.");

  response.json({ success: true, data: { business: updated } });
}

export async function getBusinessProfileController(request: Request, response: Response) {
  const business = await findBusinessById(request.user!.businessId!);
  if (!business) return fail(response, 404, "Comercio no encontrado.");
  response.json({ success: true, data: { business } });
}

export async function listBusinessOffersController(request: Request, response: Response) {
  const offers = await listOffersByBusinessId(request.user!.businessId!);
  const enriched = await Promise.all(offers.map(enrichOfferWithBusiness));
  response.json({ success: true, data: { offers: enriched } });
}

export async function toggleOfferVisibilityController(request: Request, response: Response) {
  const offerId = request.params.id;
  if (!offerId || Array.isArray(offerId)) return fail(response, 400, "ID de oferta inválido.");

  const { isVisible } = request.body as { isVisible?: boolean };
  if (typeof isVisible !== "boolean") return fail(response, 400, "isVisible debe ser true o false.");

  const updated = await updateOfferById(offerId, request.user!.businessId!, { isVisible });
  if (!updated) return fail(response, 404, "Oferta no encontrada o no pertenece a tu comercio.");

  const enriched = await enrichOfferWithBusiness(updated);
  response.json({ success: true, data: { offer: enriched } });
}

function fail(response: Response, status: number, message: string) {
  response.status(status).json({ success: false, error: { message } });
}
