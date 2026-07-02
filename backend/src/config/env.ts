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
  googleClientIds: (process.env.GOOGLE_CLIENT_ID ?? "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean),
  supabaseUrl: process.env.SUPABASE_URL ?? "https://lmmkszyrhjgbxzxtjwbm.supabase.co",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "sb_publishable_BlMt3rzIXHTN6zMA0MEQpQ_eEX4dR_5"
};
