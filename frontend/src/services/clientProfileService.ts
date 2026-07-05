import { apiRequest } from "./apiClient";

export type ClientProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
};

export type UpdateClientProfilePayload = {
  name: string;
  phone?: string;
  city?: string;
  address?: string;
};

export async function getClientProfile(token: string) {
  const response = await apiRequest<{ user: ClientProfile }>("/client/profile", {
    token
  });

  return response.user;
}

export async function updateClientProfile(
  token: string,
  payload: UpdateClientProfilePayload
) {
  const response = await apiRequest<{ user: ClientProfile }>("/client/profile", {
    body: JSON.stringify(payload),
    method: "PUT",
    token
  });

  return response.user;
}
