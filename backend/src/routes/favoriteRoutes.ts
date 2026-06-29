import { Router } from "express";
import {
  addFavoriteController,
  listFavoritesController,
  removeFavoriteController
} from "../controllers/favoriteController.js";
import { isClient } from "../middlewares/guards.js";

export const favoriteRoutes = Router();

favoriteRoutes.get("/", isClient, listFavoritesController);
favoriteRoutes.post("/:offerId", isClient, addFavoriteController);
favoriteRoutes.delete("/:offerId", isClient, removeFavoriteController);
