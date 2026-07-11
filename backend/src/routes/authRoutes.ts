import { Router } from "express";
import {
  googleLoginController,
  loginController,
  meController,
  registerBusinessController,
  registerController,
  resetPasswordController,
  toggleBusinessActiveController
} from "../controllers/authController.js";
import { isAuth } from "../middlewares/guards.js";
import { requireApiKey } from "../middlewares/apiKey.js";

export const authRoutes = Router();

authRoutes.post("/google", googleLoginController);
authRoutes.post("/register", registerController);
// Recibe POST /auth/login y lo deriva al controller de login.
authRoutes.post("/login", loginController);
authRoutes.post("/register-business", requireApiKey, registerBusinessController);
authRoutes.patch("/register-business/toggle-active", requireApiKey, toggleBusinessActiveController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.get("/me", isAuth, meController);
