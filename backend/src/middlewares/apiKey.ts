import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requireApiKey(request: Request, response: Response, next: NextFunction) {
  const key = request.header("X-API-Key");

  if (!key || key !== env.apiKey) {
    response.status(401).json({
      success: false,
      error: { message: "No estas autorizado." }
    });
    return;
  }

  next();
}
