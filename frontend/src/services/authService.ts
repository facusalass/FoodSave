import { apiRequest } from "./apiClient";
import type { AuthSession, LoginCredentials, User } from "../types/auth";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function login(credentials: LoginCredentials) {
  const response = await apiRequest<ApiResponse<AuthSession>>("/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST"
  });

  return response.data;
}

export async function getMe(token: string) {
  const response = await apiRequest<ApiResponse<{ user: User }>>("/auth/me", {
    token
  });

  return response.data.user;
}
