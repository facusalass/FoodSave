import { Router } from "express";
import { getBusinessStatsController } from "../controllers/statisticsController.js";
import { getBusinessProfileController, updateBusinessProfileController } from "../controllers/offerBusinessController.js";
import { isBusinessOwner } from "../middlewares/guards.js";
export const statisticsRoutes = Router();
statisticsRoutes.get("/stats", isBusinessOwner, getBusinessStatsController);
statisticsRoutes.get("/profile", isBusinessOwner, getBusinessProfileController);
statisticsRoutes.put("/profile", isBusinessOwner, updateBusinessProfileController);
