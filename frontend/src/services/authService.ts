// apiRequest arma el fetch real y se comunica con el backend.
import { apiRequest } from "./apiClient";
// Tipos que describen los datos enviados y recibidos en auth.
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  RegisterResult,
  User
} from "../types/auth";

// Login normal: recibe email/password y llama POST /auth/login.
export async function login(credentials: LoginCredentials) {
  // Esperamos que el backend devuelva una sesion: token + user.
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}

// Login Google: recibe el idToken entregado por Google.
export async function loginWithGoogle(idToken: string) {
  // El backend valida ese idToken con Google y devuelve la sesion de FoodSave.
  return apiRequest<AuthSession>("/auth/google", {
    body: JSON.stringify({ idToken }),
    method: "POST"
  });
}

// Restaura o valida una sesion guardada usando su token.
export async function getMe(token: string) {
  const response = await apiRequest<{ user: User }>("/auth/me", {
    token
  });

  return response.user;
}

// Registro: envia los datos del formulario a POST /auth/register.
export async function register(credentials: RegisterCredentials) {
  // Puede devolver una sesion o indicar que falta confirmar el email.
  return apiRequest<RegisterResult>("/auth/register", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}

// Recuperacion de password: solicita que el backend envie el email de recuperacion.
export async function resetPassword(email: string) {
  // Enviamos solo el email del usuario.
  return apiRequest<{ message: string }>("/auth/reset-password", {
    body: JSON.stringify({ email }),
    method: "POST"
  });
}
