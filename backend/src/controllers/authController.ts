import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { googleLogin, login, registerBusiness, registerClient } from "../services/authService.js";
import { findUserByEmail, setBusinessActive } from "../services/repository.js";
import type { RegisterError, EmailConfirmationPending } from "../services/authService.js";

function fail(response: Response, status: number, message: string) {
  response.status(status).json({ success: false, error: { message } });
}

function handleRegisterResult(result: object, response: Response, successStatus: number) {
  if ("error" in result) {
    const err = result as RegisterError;
    const isRateLimit = err.error.includes("demasiados intentos");
    return fail(response, isRateLimit ? 429 : 409, err.error);
  }
  if ("emailConfirmationRequired" in result) {
    response.status(200).json({ success: true, data: result });
    return;
  }
  response.status(successStatus).json({ success: true, data: result });
}

export async function loginController(request: Request, response: Response) {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email || !password) return fail(response, 400, "Email y contraseña son requeridos.");

  const session = await login(email, password);
  if (!session) return fail(response, 401, "Credenciales invalidas.");

  response.json({ success: true, data: session });
}

export async function registerController(request: Request, response: Response) {
  const { email, password, name, phone } = request.body as { email?: string; password?: string; name?: string; phone?: string };

  if (!name?.trim()) return fail(response, 400, "El nombre y apellido son requeridos.");
  if (!phone?.trim()) return fail(response, 400, "El telefono es requerido.");
  if (!email?.trim()) return fail(response, 400, "El correo electronico es requerido.");
  if (!isValidEmail(email)) return fail(response, 400, "Ingresa un correo electronico valido.");
  if (!password) return fail(response, 400, "La contrasena es requerida.");
  if (password.length < 6) return fail(response, 400, "La contrasena debe tener al menos 6 caracteres.");

  handleRegisterResult(await registerClient({ email, password, name, phone }), response, 201);
}

export async function googleLoginController(request: Request, response: Response) {
  const { idToken } = request.body as { idToken?: string };

  if (!idToken?.trim()) return fail(response, 400, "idToken es requerido.");

  handleRegisterResult(await googleLogin(idToken), response, 200);
}

export function meController(request: Request, response: Response) {
  response.json({ success: true, data: { user: request.user } });
}

export async function registerBusinessController(request: Request, response: Response) {
  const { email, password, businessName, businessAddress, businessCategory, businessCity, ownerName, ownerPhone } = request.body as {
    email?: string; password?: string; businessName?: string; businessAddress?: string;
    businessCategory?: string; businessCity?: string; ownerName?: string; ownerPhone?: string;
  };

  if (!email || !password || !businessName || !businessAddress || !businessCategory || !ownerName) {
    return fail(response, 400, "Faltan campos requeridos: email, password, businessName, businessAddress, businessCategory, ownerName.");
  }

  if (password.length < 6) return fail(response, 400, "La contrasena debe tener al menos 6 caracteres.");

  try {
    handleRegisterResult(await registerBusiness({
      email, password, businessName, businessAddress, businessCategory, businessCity, ownerName, ownerPhone
    }), response, 201);
  } catch (err) {
    fail(response, 500, "Error interno al crear el comercio. Revisá los logs del servidor.");
  }
}

export async function toggleBusinessActiveController(request: Request, response: Response) {
  const { businessId, isActive } = request.body as { businessId?: string; isActive?: boolean };

  if (!businessId || typeof isActive !== "boolean") {
    return fail(response, 400, "businessId e isActive (true/false) son requeridos.");
  }

  const ok = await setBusinessActive(businessId, isActive);
  if (!ok) return fail(response, 404, "Comercio no encontrado.");

  response.json({ success: true, data: { businessId, isActive, message: isActive ? "Comercio reactivado." : "Comercio suspendido." } });
}

export async function resetPasswordController(request: Request, response: Response) {
  const { email } = request.body as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) return fail(response, 400, "El correo electrónico es requerido.");

  const user = await findUserByEmail(normalizedEmail);
  if (!user) return fail(response, 404, "No encontramos una cuenta registrada con ese correo.");

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: "foodsave://reset-password" });

  if (error) {
    const status = error.status === 429 ? 429 : 500;
    const message = error.status === 429
      ? "Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar."
      : "No se pudo enviar el correo de recuperación.";
    return fail(response, status, message);
  }

  response.json({ success: true, data: { message: "Te enviamos un email con instrucciones para recuperar tu contraseña." } });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
