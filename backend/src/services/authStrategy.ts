import { supabase } from "../config/supabase.js";
import { findUserById } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
import type { PublicUser } from "../types/auth.js";

export async function validateToken(
  token: string
): Promise<PublicUser | null> {
  // 1. Intentar JWT real de Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (!error && data.user) {
    const user = await findUserById(data.user.id);
    if (user) return toPublicUser(user);

    return {
      id: data.user.id,
      name: data.user.user_metadata?.name ?? data.user.email ?? "",
      email: data.user.email ?? "",
      role: data.user.user_metadata?.role ?? "client",
      businessId: data.user.user_metadata?.businessId ?? undefined,
      phone: data.user.user_metadata?.phone ?? undefined,
      createdAt: data.user.created_at ?? new Date().toISOString()
    };
  }

  // 2. Fallback: mock-token para usuarios del seed
  const userId = token.replace("mock-token-", "");
  if (userId === token) return null; // no era mock-token

  const user = await findUserById(userId);
  return user ? toPublicUser(user) : null;
}
