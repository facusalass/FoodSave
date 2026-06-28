import type { PublicUser } from "../types/auth.js";
import { getUserFromToken } from "./authService.js";

/*
  Estrategia de autenticación swappeable.
  HOY: mock-tokens.
  MAÑANA: descomentar Supabase JWT, borrar el mock:

  import { supabase } from "../config/supabase.js";

  export async function validateToken(token: string): Promise<PublicUser | null> {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return mapSupabaseUser(data.user);
  }
*/

export async function validateToken(
  token: string
): Promise<PublicUser | null> {
  return getUserFromToken(token);
}
