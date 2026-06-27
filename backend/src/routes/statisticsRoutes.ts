import { Router } from "express";
import { getBusinessStatsController } from "../controllers/statisticsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const statisticsRoutes = Router();

statisticsRoutes.get("/stats", requireAuth, getBusinessStatsController);
