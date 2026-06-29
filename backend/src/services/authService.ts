import { supabase } from "../config/supabase.js";
import { createBusinessRepo, findUserByEmail, findUserById } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
import type { AuthSession, Business, PublicUser, UserRole } from "../types/auth.js";

async function dbLogin(email: string): Promise<AuthSession | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  return {
    token: `mock-token-${user.id}`,
    user: toPublicUser(user)
  };
}

export async function registerClient(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<AuthSession & { user: PublicUser } | { error: string }> {
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

  // La sesión puede ser null si el proveedor requiere confirmación de email
  if (!data.session) {
    return { error: "Revisá tu correo para confirmar la cuenta." };
  }

  const user = await findUserById(data.user!.id);

  return {
    token: data.session.access_token,
    user: user ? toPublicUser(user) : {
      id: data.user!.id,
      name: params.name.trim(),
      email,
      role: "client",
      phone: params.phone.trim(),
      createdAt: new Date().toISOString()
    }
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

  if (!error && data.session) {
    const user = await findUserById(data.user.id);
    return {
      token: data.session.access_token,
      user: user ? toPublicUser(user) : {
        id: data.user.id,
        name: data.user.user_metadata?.name ?? email,
        email: data.user.email ?? email,
        role: data.user.user_metadata?.role ?? "client",
        phone: data.user.user_metadata?.phone,
        createdAt: data.user.created_at ?? new Date().toISOString()
      }
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
}): Promise<AuthSession & { user: PublicUser } | { error: string }> {
  const { email, name, role, businessName, businessAddress, businessCategory } = params;
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
    return { error: "Revisá tu correo para confirmar la cuenta." };
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
    user: user ? toPublicUser(user) : {
      id: data.user.id,
      name,
      email: normalizedEmail,
      role,
      businessId,
      phone: "",
      createdAt: now
    }
  };
}

export async function getUserFromToken(
  token: string
): Promise<PublicUser | null> {
  const userId = token.replace("mock-token-", "");
  const user = await findUserById(userId);
  return user ? toPublicUser(user) : null;
}
