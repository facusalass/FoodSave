import { Router } from "express";
import {
  googleLoginController,
  loginController,
  meController,
  registerController
} from "../controllers/authController.js";
import { isAuth } from "../middlewares/isAuth.js";

export const authRoutes = Router();

authRoutes.post("/google", googleLoginController);
authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.get("/me", isAuth, meController);
