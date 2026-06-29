import type { Request, Response } from "express";
import { createOffer, deleteOffer, updateOffer } from "../services/offerService.js";
import type { OfferType } from "../types/offer.js";

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
    estimatedWeightInKg
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
      estimatedWeightInKg
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

  const { oldPrice, newPrice, stock, pickupWindow, pickupLimit } = request.body as {
    oldPrice?: number;
    newPrice?: number;
    stock?: number;
    pickupWindow?: string;
    pickupLimit?: string;
  };

  const offer = await updateOffer(offerId, request.user!.businessId!, {
    oldPrice,
    newPrice,
    stock,
    pickupWindow,
    pickupLimit
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
