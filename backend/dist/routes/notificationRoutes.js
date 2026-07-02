import { Router } from "express";
import { listNotificationsController, markAllReadController, markReadController } from "../controllers/notificationController.js";
import { isAuth } from "../middlewares/guards.js";
export const notificationRoutes = Router();
notificationRoutes.get("/", isAuth, listNotificationsController);
notificationRoutes.patch("/read-all", isAuth, markAllReadController);
notificationRoutes.patch("/:id/read", isAuth, markReadController);
