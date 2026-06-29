import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { googleLogin, login, registerClient } from "../services/authService.js";
import { findUserByEmail } from "../services/repository.js";

export async function loginController(request: Request, response: Response) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    response.status(400).json({
      success: false,
      error: { message: "Email y contraseña son requeridos." }
    });
    return;
  }

  const session = await login(email, password);

  if (!session) {
    response.status(401).json({
      success: false,
      error: { message: "Credenciales invalidas." }
    });
    return;
  }

  response.json({ success: true, data: session });
}

export async function registerController(
  request: Request,
  response: Response
) {
  const { email, password, name, phone } = request.body as {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  };

  if (!name?.trim()) {
    response.status(400).json({
      success: false,
      error: { message: "El nombre y apellido son requeridos." }
    });
    return;
  }

  if (!phone?.trim()) {
    response.status(400).json({
      success: false,
      error: { message: "El telefono es requerido." }
    });
    return;
  }

  if (!email?.trim()) {
    response.status(400).json({
      success: false,
      error: { message: "El correo electronico es requerido." }
    });
    return;
  }

  if (!isValidEmail(email)) {
    response.status(400).json({
      success: false,
      error: { message: "Ingresa un correo electronico valido." }
    });
    return;
  }

  if (!password) {
    response.status(400).json({
      success: false,
      error: { message: "La contrasena es requerida." }
    });
    return;
  }

  if (password.length < 6) {
    response.status(400).json({
      success: false,
      error: { message: "La contrasena debe tener al menos 6 caracteres." }
    });
    return;
  }

  const result = await registerClient({ email, password, name, phone });

  if ("error" in result) {
    const isRateLimit = result.error.includes("demasiados intentos");
    response.status(isRateLimit ? 429 : 409).json({
      success: false,
      error: { message: result.error }
    });
    return;
  }

  if ("emailConfirmationRequired" in result) {
    response.status(200).json({ success: true, data: result });
    return;
  }

  response.status(201).json({ success: true, data: result });
}

export async function googleLoginController(
  request: Request,
  response: Response
) {
  const { email, name, role, businessName, businessAddress, businessCategory, businessCity } =
    request.body as {
      email?: string;
      name?: string;
      role?: string;
      businessName?: string;
      businessAddress?: string;
      businessCategory?: string;
      businessCity?: string;
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

  const result = await googleLogin({
    email,
    name,
    role,
    businessName,
    businessAddress,
    businessCategory,
    businessCity
  });

  if ("error" in result) {
    response.status(400).json({
      success: false,
      error: { message: result.error }
    });
    return;
  }

  if ("emailConfirmationRequired" in result) {
    response.status(200).json({ success: true, data: result });
    return;
  }

  response.json({ success: true, data: result });
}

export function meController(request: Request, response: Response) {
  response.json({ success: true, data: { user: request.user } });
}

export async function resetPasswordController(request: Request, response: Response) {
  const { email } = request.body as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    response.status(400).json({
      success: false,
      error: { message: "El correo electrónico es requerido." }
    });
    return;
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    response.status(404).json({
      success: false,
      error: { message: "No encontramos una cuenta registrada con ese correo." }
    });
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: "foodsave://reset-password"
  });

  if (error) {
    const status = error.status === 429 ? 429 : 500;
    const message = error.status === 429
      ? "Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar."
      : "No se pudo enviar el correo de recuperación.";

    response.status(status).json({
      success: false,
      error: { message }
    });
    return;
  }

  response.json({
    success: true,
    data: { message: "Te enviamos un email con instrucciones para recuperar tu contraseña." }
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
