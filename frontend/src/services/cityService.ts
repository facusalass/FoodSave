import { apiRequest } from "./apiClient";

export async function getCities() {
  const response = await apiRequest<{ cities: string[] }>("/cities");
  const uniqueCities = new Map<string, string>();

  response.cities.forEach((city) => {
    const normalizedCity = normalizeCityName(city);

    if (normalizedCity) {
      uniqueCities.set(normalizedCity.toLocaleLowerCase("es-AR"), normalizedCity);
    }
  });

  return Array.from(uniqueCities.values());
}

// Unifica variantes como "resistencia, chaco" y "Resistencia, Chaco".
export function normalizeCityName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .toLocaleLowerCase("es-AR")
    .replace(/(^|[\s,.-])\p{L}/gu, (match) =>
      match.toLocaleUpperCase("es-AR")
    );
}
