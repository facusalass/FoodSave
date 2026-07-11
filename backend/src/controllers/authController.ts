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

// Recibe email/password, delega la validacion y devuelve la sesion al frontend.
export async function loginController(request: Request, response: Response) {
  // Datos que llegaron desde el frontend en el body JSON.
  const { email, password } = request.body as { email?: string; password?: string };

  // Si falta algun campo, respondemos 400 sin consultar Supabase.

  if (!email || !password) return fail(response, 400, "Email y contraseña son requeridos.");

  // El service valida las credenciales con Supabase y devuelve sesion o null.
  const session = await login(email, password);
  if (session && "reason" in session && session.reason === "email_not_confirmed") {
    return fail(response, 403, session.error);
  }

  if (!session) return fail(response, 401, "Credenciales invalidas.");

  // Respuesta exitosa: { success, data: { token, user } }.
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

  if (!idToken) return fail(response, 400, "El idToken de Google es requerido.");

  handleRegisterResult(await googleLogin(idToken), response, 200);
}

export async function registerBusinessController(request: Request, response: Response) {
  const { email, password, businessName, businessAddress, businessCategory, businessCity, ownerName, ownerPhone } = request.body as {
    email?: string; password?: string; businessName?: string; businessAddress?: string;
    businessCategory?: string; businessCity?: string; ownerName?: string; ownerPhone?: string;
  };

  if (!email || !password || !businessName || !businessAddress || !businessCategory || !ownerName) {
    return fail(response, 400, "Faltan campos requeridos: email, password, businessName, businessAddress, businessCategory, ownerName.");
  }

  handleRegisterResult(
    await registerBusiness({
      email, password, businessName, businessAddress, businessCategory, businessCity, ownerName, ownerPhone
    }),
    response,
    201
  );
}

export async function toggleBusinessActiveController(request: Request, response: Response) {
  const { email, isActive } = request.body as { email?: string; isActive?: boolean };

  if (!email) return fail(response, 400, "El email del comercio es requerido.");
  if (typeof isActive !== "boolean") return fail(response, 400, "isActive (boolean) es requerido.");

  const user = await findUserByEmail(email.toLowerCase());
  if (!user || user.role !== "business" || !user.businessId) {
    return fail(response, 404, "No se encontro un comercio con ese email.");
  }

  const ok = await setBusinessActive(user.businessId, isActive);
  if (!ok) return fail(response, 500, "No se pudo actualizar el estado del comercio.");

  response.json({ success: true, data: { businessId: user.businessId, isActive } });
}

export async function resetPasswordController(request: Request, response: Response) {
  const { email } = request.body as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!email) return fail(response, 400, "El email es requerido.");

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: "foodsave://reset-password"
  });

  response.json({ success: true, data: { message: "Te enviamos un email con instrucciones para recuperar tu contraseña." } });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
