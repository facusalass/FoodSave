import { Router } from "express";
import { supabase } from "../config/supabase.js";

export const citiesRoutes = Router();

citiesRoutes.get("/", async (_request, response) => {
  const { data } = await supabase
    .from("businesses")
    .select("city")
    .order("city");

  const uniqueCities = new Map<string, string>();

  (data ?? []).forEach((business) => {
    const city = normalizeCityName(business.city ?? "");

    if (city) {
      uniqueCities.set(city.toLocaleLowerCase("es-AR"), city);
    }
  });

  const cities = Array.from(uniqueCities.values());

  response.json({ success: true, data: { cities } });
});

function normalizeCityName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .toLocaleLowerCase("es-AR")
    .replace(/(^|[\s,.-])\p{L}/gu, (match) =>
      match.toLocaleUpperCase("es-AR")
    );
}
