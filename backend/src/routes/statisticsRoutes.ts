import { Router } from "express";
import { getBusinessStatsController } from "../controllers/statisticsController.js";
import { isBusinessOwner } from "../middlewares/isBusinessOwner.js";

export const statisticsRoutes = Router();

statisticsRoutes.get("/stats", isBusinessOwner, getBusinessStatsController);
