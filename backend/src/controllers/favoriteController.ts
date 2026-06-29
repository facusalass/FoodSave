import type { Request, Response } from "express";
import { addFavorite, listFavorites, removeFavorite } from "../services/favoriteService.js";

export async function listFavoritesController(
  request: Request,
  response: Response
) {
  const favorites = await listFavorites(request.user!.id);
  response.json({ success: true, data: { favorites } });
}

export async function addFavoriteController(
  request: Request,
  response: Response
) {
  const offerId = request.params.offerId;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const result = await addFavorite(request.user!.id, offerId);

  if ("error" in result) {
    response.status(404).json({
      success: false,
      error: { message: result.error }
    });
    return;
  }

  response.status(201).json({ success: true, data: { favorite: result } });
}

export async function removeFavoriteController(
  request: Request,
  response: Response
) {
  const offerId = request.params.offerId;

  if (!offerId || Array.isArray(offerId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de oferta inválido." }
    });
    return;
  }

  const removed = await removeFavorite(request.user!.id, offerId);

  if (!removed) {
    response.status(404).json({
      success: false,
      error: { message: "Favorito no encontrado." }
    });
    return;
  }

  response.json({ success: true, data: { message: "Favorito eliminado." } });
}
