import { Router } from "express";
import { deleteAllNotificationsController, deleteNotificationController, listNotificationsController, markAllReadController, markReadController } from "../controllers/notificationController.js";
import { isAuth } from "../middlewares/guards.js";
export const notificationRoutes = Router();
notificationRoutes.get("/", isAuth, listNotificationsController);
notificationRoutes.delete("/", isAuth, deleteAllNotificationsController);
notificationRoutes.patch("/read-all", isAuth, markAllReadController);
notificationRoutes.delete("/:id", isAuth, deleteNotificationController);
notificationRoutes.patch("/:id/read", isAuth, markReadController);
