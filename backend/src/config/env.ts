import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:8081",
  supabaseUrl: process.env.SUPABASE_URL ?? "https://placeholder.supabase.co",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "placeholder-anon-key"
};
