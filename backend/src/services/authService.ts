import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { findUserByEmail, findUserById, createBusinessRepo } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
import type { AuthSession, Business, PublicUser, UserRole } from "../types/auth.js";

const googleClient = new OAuth2Client();

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

export async function googleLogin(
  idToken: string
): Promise<RegisterResult | RegisterError | EmailConfirmationPending> {
  const googleUser = await verifyGoogleIdToken(idToken);

  if ("error" in googleUser) {
    return googleUser;
  }

  const normalizedEmail = googleUser.email.toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return {
      token: `mock-token-${existing.id}`,
      user: toPublicUser(existing)
    };
  }

  const password = `google-${Date.now()}`;

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: googleUser.name, role: "client", phone: "" }
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
    user: user ? toPublicUser(user) : buildUserFromAuth(data.user, googleUser.name, "client")
  };
}

async function verifyGoogleIdToken(idToken: string): Promise<
  | { email: string; name: string }
  | RegisterError
> {
  if (env.googleClientIds.length === 0) {
    return { error: "Google Login no esta configurado en el servidor." };
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      audience: env.googleClientIds,
      idToken
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return { error: "Google no devolvio datos de usuario." };
    }

    const email = payload.email?.trim();

    if (!email) {
      return { error: "Google no devolvio un correo valido." };
    }

    if (payload.email_verified === false) {
      return { error: "El correo de Google no esta verificado." };
    }

    return {
      email,
      name: payload.name?.trim() || email.split("@")[0] || "Usuario FoodSave"
    };
  } catch {
    return { error: "No pudimos validar tu cuenta de Google." };
  }
}

export async function registerBusiness(params: {
  email: string;
  password: string;
  businessName: string;
  businessAddress: string;
  businessCategory: string;
  businessCity?: string;
  ownerName: string;
}): Promise<RegisterResult | RegisterError | EmailConfirmationPending> {
  const { email, password, businessName, businessAddress, businessCategory, businessCity, ownerName } = params;
  const normalizedEmail = email.toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) return { error: "Ya existe una cuenta con ese correo." };

  const now = new Date().toISOString();
  const businessId = `business-${Date.now()}`;

  const newBusiness: Business = {
    id: businessId,
    name: businessName,
    ownerId: businessId,
    category: businessCategory,
    description: "",
    city: businessCity ?? "",
    address: businessAddress,
    closingTime: "22:00",
    paymentInfo: {
      ownerName,
      cvu: `000000310001${String(Date.now()).slice(0, 10)}`,
      alias: `${businessName.replace(/\s+/g, ".").toUpperCase()}`
    },
    createdAt: now
  };

  const business = await createBusinessRepo(newBusiness);
  if (!business) return { error: "No se pudo crear el comercio. Reintentá en unos minutos." };

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: ownerName, role: "business", businessId, phone: "" }
    }
  });

  if (error) return { error: normalizeSignUpError(error.message) };
  if (!data.session || !data.user) return { emailConfirmationRequired: true, message: "Revisá tu correo para confirmar la cuenta." };

  await supabase.from("businesses").update({ ownerId: data.user.id }).eq("id", businessId);

  const user = await findUserById(data.user.id);

  return {
    token: data.session.access_token,
    user: user ? toPublicUser(user) : buildUserFromAuth(data.user, ownerName, "business")
  };
}
