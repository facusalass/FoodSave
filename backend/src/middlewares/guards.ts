import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types/auth.js";
import { validateToken } from "../services/authStrategy.js";

function extractToken(request: Request) {
  const authorization = request.header("Authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

function reject(response: Response, status: number, message: string) {
  response.status(status).json({ success: false, error: { message } });
}

export function isAuth(
  request: Request,
  response: Response,
  next: NextFunction
) {
  return authenticate(request, response, next);
}

export function isClient(
  request: Request,
  response: Response,
  next: NextFunction
) {
  return authenticate(request, response, next, "client");
}

export function isBusinessOwner(
  request: Request,
  response: Response,
  next: NextFunction
) {
  return authenticate(request, response, next, "business");
}

async function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
  requiredRole?: UserRole
) {
  const token = extractToken(request);

  if (!token) {
    reject(response, 401, "No estas autorizado.");
    return;
  }

  const user = await validateToken(token);

  if (!user) {
    reject(response, 401, "Sesion expirada o token invalido.");
    return;
  }

  if (requiredRole === "business" && (!user.businessId || user.role !== "business")) {
    reject(response, 403, "Solo los comercios pueden realizar esta accion.");
    return;
  }

  if (requiredRole === "client" && user.role !== "client") {
    reject(response, 403, "Solo los clientes pueden realizar esta accion.");
    return;
  }

  request.token = token;
  request.user = user;
  next();
}
