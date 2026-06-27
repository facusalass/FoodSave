import { Router } from "express";
import {
  createOfferController,
  deleteOfferController,
  updateOfferController
} from "../controllers/offerBusinessController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const offerBusinessRoutes = Router();

offerBusinessRoutes.post("/", requireAuth, createOfferController);
offerBusinessRoutes.put("/:id", requireAuth, updateOfferController);
offerBusinessRoutes.delete("/:id", requireAuth, deleteOfferController);
