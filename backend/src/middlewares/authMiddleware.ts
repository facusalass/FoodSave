import type { NextFunction, Request, Response } from "express";
import { getUserFromToken } from "../services/authService.js";

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    response.status(401).json({ message: "Token requerido." });
    return;
  }

  const user = getUserFromToken(token);

  if (!user) {
    response.status(401).json({ message: "Token inválido." });
    return;
  }

  request.token = token;
  request.user = user;
  next();
}
