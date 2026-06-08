import { Router } from "express";
import {
  loginController,
  meController
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

export const authRoutes = Router();

authRoutes.post("/login", loginController);
authRoutes.get("/me", requireAuth, meController);
