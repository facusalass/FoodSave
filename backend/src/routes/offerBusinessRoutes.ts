import { Router } from "express";
import {
  createOfferController,
  deleteOfferController,
  updateOfferController
} from "../controllers/offerBusinessController.js";
import { isBusinessOwner } from "../middlewares/isBusinessOwner.js";

export const offerBusinessRoutes = Router();

offerBusinessRoutes.post("/", isBusinessOwner, createOfferController);
offerBusinessRoutes.put("/:id", isBusinessOwner, updateOfferController);
offerBusinessRoutes.delete("/:id", isBusinessOwner, deleteOfferController);
