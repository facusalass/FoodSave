import { Router } from "express";
import {
  googleLoginController,
  loginController,
  meController,
  registerController,
  resetPasswordController
} from "../controllers/authController.js";
import { isAuth } from "../middlewares/guards.js";

export const authRoutes = Router();

authRoutes.post("/google", googleLoginController);
authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.get("/me", isAuth, meController);
