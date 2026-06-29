import { supabase } from "../config/supabase.js";
import { createBusinessRepo, findUserByEmail, findUserById } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
import type { AuthSession, Business, PublicUser, UserRole } from "../types/auth.js";

function buildUserFromAuth(authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; created_at?: string }, fallbackName: string, fallbackRole: UserRole): PublicUser {
  return {
    id: authUser.id,
    name: (authUser.user_metadata?.name as string) ?? fallbackName,
    email: authUser.email ?? "",
    role: (authUser.user_metadata?.role as UserRole) ?? fallbackRole,
    businessId: authUser.user_metadata?.businessId as string | undefined,
    phone: authUser.user_metadata?.phone as string | undefined,
    createdAt: authUser.created_at ?? new Date().toISOString()
  };
}

export type RegisterResult = AuthSession & { user: PublicUser };
export type RegisterError = { error: string };
export type EmailConfirmationPending = { emailConfirmationRequired: true; message: string };

export async function registerClient(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<RegisterResult | RegisterError | EmailConfirmationPending> {
  const { email, password } = params;
  const already = await findUserByEmail(email.toLowerCase());

  if (already) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: params.name.trim(),
        phone: params.phone.trim(),
        role: "client"
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session || !data.user) {
    return { emailConfirmationRequired: true as const, message: "Revisá tu correo para confirmar la cuenta." };
  }

  const user = await findUserById(data.user.id);

  return {
    token: data.session.access_token,
    user: user ? toPublicUser(user) : buildUserFromAuth(data.user, params.name.trim(), "client")
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthSession | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Intentar Supabase Auth (usuarios registrados via la app)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password
  });

  if (!error && data.session && data.user) {
    const user = await findUserById(data.user.id);
    return {
      token: data.session.access_token,
      user: user ? toPublicUser(user) : buildUserFromAuth(data.user, email, "client")
    };
  }

  // 2. Fallback: usuarios del seed (mock)
  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.password !== password) return null;

  return {
    token: `mock-token-${user.id}`,
    user: toPublicUser(user)
  };
}

export async function googleLogin(params: {
  email: string;
  name: string;
  role: UserRole;
  businessName?: string;
  businessAddress?: string;
  businessCategory?: string;
  businessCity?: string;
}): Promise<RegisterResult | RegisterError | EmailConfirmationPending> {
  const { email, name, role, businessName, businessAddress, businessCategory, businessCity } = params;
  const normalizedEmail = email.toLowerCase();

  // Si ya existe, loguear
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return {
      token: `mock-token-${existing.id}`,
      user: toPublicUser(existing)
    };
  }

  const now = new Date().toISOString();

  let businessId: string | undefined;

  if (role === "business") {
    if (!businessName || !businessAddress || !businessCategory) {
      return { error: "Los comercios deben enviar businessName, businessAddress y businessCategory." };
    }

    businessId = `business-${Date.now()}`;

    const newBusiness: Business = {
      id: businessId,
      name: businessName,
      ownerId: "",   // se actualiza después con el ID real
      category: businessCategory,
      description: "",
      city: businessCity ?? "",
      address: businessAddress,
      closingTime: "22:00",
      paymentInfo: {
        ownerName: name,
        cvu: `000000310001${String(Date.now()).slice(0, 10)}`,
        alias: `${businessName.replace(/\s+/g, ".").toUpperCase()}`
      },
      createdAt: now
    };

    await createBusinessRepo(newBusiness);
  }

  const password = `google-${Date.now()}`;

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name, role, businessId, phone: "" }
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session || !data.user) {
    return { emailConfirmationRequired: true as const, message: "Revisá tu correo para confirmar la cuenta." };
  }

  // Si es business, actualizar el ownerId del negocio
  if (businessId) {
    await supabase
      .from("businesses")
      .update({ ownerId: data.user.id })
      .eq("id", businessId);
  }

  const user = await findUserById(data.user.id);

  return {
    token: data.session.access_token,
    user: user ? toPublicUser(user) : buildUserFromAuth(data.user, name, role)
  };
}
