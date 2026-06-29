import { Router } from "express";
import { getBusinessStatsController } from "../controllers/statisticsController.js";
import { isBusinessOwner } from "../middlewares/guards.js";

export const statisticsRoutes = Router();

statisticsRoutes.get("/stats", isBusinessOwner, getBusinessStatsController);
