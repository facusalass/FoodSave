import { Router } from "express";
import { getBusinessStatsController } from "../controllers/statisticsController.js";
import { updateBusinessProfileController } from "../controllers/offerBusinessController.js";
import { isBusinessOwner } from "../middlewares/guards.js";

export const statisticsRoutes = Router();

statisticsRoutes.get("/stats", isBusinessOwner, getBusinessStatsController);
statisticsRoutes.put("/profile", isBusinessOwner, updateBusinessProfileController);
