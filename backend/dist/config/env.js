import dotenv from "dotenv";
dotenv.config();
export const env = {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:8081",
    googleClientIds: (process.env.GOOGLE_CLIENT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    supabaseUrl: process.env.SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    apiKey: process.env.API_KEY ?? "foodsave-api-key-dev"
};
