import { Router } from "express";
import {
  createReservationController,
  listReservationsController,
  updateReservationStatusController
} from "../controllers/reservationController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const reservationRoutes = Router();

reservationRoutes.post("/", requireAuth, createReservationController);
reservationRoutes.get("/", requireAuth, listReservationsController);
reservationRoutes.patch(
  "/:id/status",
  requireAuth,
  updateReservationStatusController
);
