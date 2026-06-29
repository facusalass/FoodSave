import { supabase } from "../config/supabase.js";
import { createBusinessRepo, findUserByEmail, findUserById } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
import type { AuthSession, Business, PublicUser, UserRole } from "../types/auth.js";

function normalizeSignUpError(message: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("already") || m.includes("duplicate")) return "Ya existe una cuenta con ese correo.";
  if (m.includes("rate") || m.includes("limit") || m.includes("too many")) return "Se hicieron demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (m.includes("password") || m.includes("weak")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("email") || m.includes("format")) return "Ingresá un correo electrónico válido.";
  return "No pudimos crear la cuenta por un problema del servicio de registro. Probá de nuevo en unos minutos.";
}

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
    return { error: normalizeSignUpError(error.message) };
  }

  if (!data.session || !data.user) {
    return { emailConfirmationRequired: true, message: "Revisá tu correo para confirmar la cuenta." };
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
      ownerId: "",
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
    return { error: normalizeSignUpError(error.message) };
  }

  if (!data.session || !data.user) {
    return { emailConfirmationRequired: true, message: "Revisá tu correo para confirmar la cuenta." };
  }

  if (businessId) {
    await supabase.from("businesses").update({ ownerId: data.user.id }).eq("id", businessId);
  }

  const user = await findUserById(data.user.id);

  return {
    token: data.session.access_token,
    user: user ? toPublicUser(user) : buildUserFromAuth(data.user, name, role)
  };
}
