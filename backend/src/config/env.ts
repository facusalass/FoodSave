import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:8081",
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY")
};
