import { Router } from "express";
import { getOfferController, listOffersController } from "../controllers/offerPublicController.js";
export const offerRoutes = Router();
offerRoutes.get("/", listOffersController);
offerRoutes.get("/:id", getOfferController);
