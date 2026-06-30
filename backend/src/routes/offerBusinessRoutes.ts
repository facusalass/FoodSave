import { Router } from "express";
import {
  createOfferController,
  deleteOfferController,
  listBusinessOffersController,
  toggleOfferVisibilityController,
  updateOfferController
} from "../controllers/offerBusinessController.js";
import { isBusinessOwner } from "../middlewares/guards.js";

export const offerBusinessRoutes = Router();

offerBusinessRoutes.get("/", isBusinessOwner, listBusinessOffersController);
offerBusinessRoutes.post("/", isBusinessOwner, createOfferController);
offerBusinessRoutes.put("/:id", isBusinessOwner, updateOfferController);
offerBusinessRoutes.patch("/:id/visibility", isBusinessOwner, toggleOfferVisibilityController);
offerBusinessRoutes.delete("/:id", isBusinessOwner, deleteOfferController);
