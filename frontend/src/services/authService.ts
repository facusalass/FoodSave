import { apiRequest } from "./apiClient";
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  RegisterResult,
  User
} from "../types/auth";

export async function login(credentials: LoginCredentials) {
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}

export async function loginWithGoogle(idToken: string) {
  return apiRequest<AuthSession>("/auth/google", {
    body: JSON.stringify({ idToken }),
    method: "POST"
  });
}

export async function getMe(token: string) {
  const response = await apiRequest<{ user: User }>("/auth/me", {
    token
  });

  return response.user;
}

export async function register(credentials: RegisterCredentials) {
  return apiRequest<RegisterResult>("/auth/register", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}

export async function resetPassword(email: string) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    body: JSON.stringify({ email }),
    method: "POST"
  });
}
