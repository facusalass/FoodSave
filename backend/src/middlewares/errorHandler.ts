import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({ "success": false, error:{
    message: `Ruta no encontrada: ${request.method} ${request.originalUrl}`}});
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const message =
    error instanceof Error ? error.message : "Error interno del servidor.";

  response.status(500).json({ "success": false, error:{ message} });
}
