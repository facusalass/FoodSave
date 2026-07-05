import { Router } from "express";
import { getClientProfileController, updateClientProfileController } from "../controllers/clientProfileController.js";
import { isClient } from "../middlewares/guards.js";
export const clientProfileRoutes = Router();
clientProfileRoutes.get("/", isClient, getClientProfileController);
clientProfileRoutes.put("/", isClient, updateClientProfileController);
