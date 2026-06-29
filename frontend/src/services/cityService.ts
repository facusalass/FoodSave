import { apiRequest } from "./apiClient";

export async function getCities() {
  const response = await apiRequest<{ cities: string[] }>("/cities");
  return response.cities;
}
