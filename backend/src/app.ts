import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { offerRoutes } from "./routes/offerRoutes.js";
import { reservationRoutes } from "./routes/reservationRoutes.js";
import { statisticsRoutes } from "./routes/statisticsRoutes.js";

export const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({"success":true,"data":{ status: "ok", service: "foodsave-api"} });
});

app.use("/auth", authRoutes);
app.use("/offers", offerRoutes);
app.use("/reservations", reservationRoutes);
app.use("/business", statisticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
