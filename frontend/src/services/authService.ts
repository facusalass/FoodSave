import { apiRequest } from "./apiClient";
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  User
} from "../types/auth";

export async function login(credentials: LoginCredentials) {
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify(credentials),
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
  return apiRequest<AuthSession>("/auth/register", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}
