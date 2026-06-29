import { Router } from "express";
import {
  createReservationController,
  listReservationsController,
  updateReservationStatusController
} from "../controllers/reservationController.js";
import { isAuth } from "../middlewares/guards.js";

export const reservationRoutes = Router();

reservationRoutes.post("/", isAuth, createReservationController);
reservationRoutes.get("/", isAuth, listReservationsController);
reservationRoutes.patch(
  "/:id/status",
  isAuth,
  updateReservationStatusController
);
