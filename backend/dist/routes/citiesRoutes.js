import { Router } from "express";
import { supabase } from "../config/supabase.js";
export const citiesRoutes = Router();
citiesRoutes.get("/", async (_request, response) => {
    const { data } = await supabase
        .from("businesses")
        .select("city")
        .order("city");
    const cities = [...new Set((data ?? []).map((b) => b.city))];
    response.json({ success: true, data: { cities } });
});
