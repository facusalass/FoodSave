import { apiRequest } from "./apiClient";
import type { AuthSession, LoginCredentials, User } from "../types/auth";

export function login(credentials: LoginCredentials) {
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}

export async function getMe(token: string) {
  const response = await apiRequest<{ user: User }>("/auth/me", { token });
  return response.user;
}
