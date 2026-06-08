import type { Request, Response } from "express";
import { login } from "../services/authService.js";

export function loginController(request: Request, response: Response) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    response.status(400).json({ message: "Email y contraseña son requeridos." });
    return;
  }

  const session = login(email, password);

  if (!session) {
    response.status(401).json({ message: "Credenciales inválidas." });
    return;
  }

  response.json(session);
}

export function meController(request: Request, response: Response) {
  response.json({ user: request.user });
}
