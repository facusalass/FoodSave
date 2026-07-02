import { Router } from "express";
import multer from "multer";
import { uploadImageController } from "../controllers/uploadController.js";
import { isBusinessOwner } from "../middlewares/guards.js";
const upload = multer({ storage: multer.memoryStorage() });
export const uploadRoutes = Router();
uploadRoutes.post("/image", isBusinessOwner, upload.single("file"), uploadImageController);
