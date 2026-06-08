import { Router } from "express";
import {
  getOfferController,
  listOffersController
} from "../controllers/offerController.js";

export const offerRoutes = Router();

offerRoutes.get("/", listOffersController);
offerRoutes.get("/:id", getOfferController);
