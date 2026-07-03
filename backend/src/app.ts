import cors from "cors";
import express from "express";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { offerRoutes } from "./routes/offerRoutes.js";
import { citiesRoutes } from "./routes/citiesRoutes.js";
import { reservationRoutes } from "./routes/reservationRoutes.js";
import { offerBusinessRoutes } from "./routes/offerBusinessRoutes.js";
import { favoriteRoutes } from "./routes/favoriteRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { statisticsRoutes } from "./routes/statisticsRoutes.js";
import { uploadRoutes } from "./routes/uploadRoutes.js";

export const app = express();

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-API-Key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({"success":true,"data":{ status: "ok", service: "foodsave-api"} });
});

app.use("/auth", authRoutes);
app.use("/offers", offerRoutes);
app.use("/cities", citiesRoutes);
app.use("/reservations", reservationRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/notifications", notificationRoutes);
app.use("/business/offers", offerBusinessRoutes);
app.use("/business", statisticsRoutes);
app.use("/upload", uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
