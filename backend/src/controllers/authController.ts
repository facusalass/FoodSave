import type { Request, Response } from "express";
import { googleLogin, login, register } from "../services/authService.js";

export function loginController(request: Request, response: Response) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    response.status(400).json({success: false, error: { message: "Email y contraseña son requeridos." }});
    return;
  }

  const session = login(email, password);

  if (!session) {
    response.status(401).json({ success: false, error: { message: "Credenciales invalidas." } });
    return;
  }

  response.json({ success: true, data: session });
}

export function registerController(request: Request, response: Response) {
  const { email, password, name, role, businessName, businessAddress, businessCategory } = request.body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    businessName?: string;
    businessAddress?: string;
    businessCategory?: string;
  };

  if (!email || !password || !name || !role) {
    response.status(400).json({
      success: false,
      error: { message: "email, password, name y role son requeridos." }
    });
    return;
  }

  if (role !== "client" && role !== "business") {
    response.status(400).json({
      success: false,
      error: { message: "role debe ser 'client' o 'business'." }
    });
    return;
  }

  const result = register({
    email,
    password,
    name,
    role,
    businessName,
    businessAddress,
    businessCategory
  });

  if ("error" in result) {
    response.status(409).json({ success: false, error: { message: result.error } });
    return;
  }

  response.status(201).json({ success: true, data: result });
}

export function googleLoginController(request: Request, response: Response) {
  const { email, name, role, businessName, businessAddress, businessCategory } = request.body as {
    email?: string;
    name?: string;
    role?: string;
    businessName?: string;
    businessAddress?: string;
    businessCategory?: string;
  };

  if (!email || !name || !role) {
    response.status(400).json({
      success: false,
      error: { message: "email, name y role son requeridos." }
    });
    return;
  }

  if (role !== "client" && role !== "business") {
    response.status(400).json({
      success: false,
      error: { message: "role debe ser 'client' o 'business'." }
    });
    return;
  }

  const result = googleLogin({ email, name, role, businessName, businessAddress, businessCategory });

  if ("error" in result) {
    response.status(400).json({ success: false, error: { message: result.error } });
    return;
  }

  response.json({ success: true, data: result });
}

export function meController(request: Request, response: Response) {
  response.json({ success:true, data:{ user: request.user} });
}
