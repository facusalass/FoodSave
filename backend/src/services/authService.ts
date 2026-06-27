import { mockBusinesses, mockUsers } from "../data/users.js";
import type { AuthSession, Business, PublicUser, User } from "../types/auth.js";
import { toPublicUser } from "../utils/publicUser.js";

function tokenForUser(userId: string) {
  return `mock-token-${userId}`;
}

export function register(params: {
  email: string;
  password: string;
  name: string;
  role: "client" | "business";
  businessName?: string;
  businessAddress?: string;
  businessCategory?: string;
}): AuthSession & { user: PublicUser } | { error: string } {
  const { email, password, name, role, businessName, businessAddress, businessCategory } = params;

  const exists = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { error: "El email ya está registrado." };
  }

  const now = new Date().toISOString();
  const userId = `user-${Date.now()}`;

  let businessId: string | undefined;

  if (role === "business") {
    if (!businessName || !businessAddress || !businessCategory) {
      return { error: "Los comercios deben enviar businessName, businessAddress y businessCategory." };
    }

    businessId = `business-${Date.now()}`;

    const newBusiness: Business = {
      id: businessId,
      name: businessName,
      ownerId: userId,
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

    mockBusinesses.push(newBusiness);
  }

  const newUser: User = {
    id: userId,
    name,
    email,
    password,
    role,
    businessId,
    createdAt: now
  };

  mockUsers.push(newUser);

  return {
    token: tokenForUser(userId),
    user: toPublicUser(newUser)
  };
}

export function registerClient(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): AuthSession & { user: PublicUser } | { error: string } {
  const email = params.email.trim().toLowerCase();
  const exists = mockUsers.find((u) => u.email.toLowerCase() === email);

  if (exists) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const now = new Date().toISOString();
  const userId = `user-${Date.now()}`;
  const newUser: User = {
    id: userId,
    name: params.name.trim(),
    email,
    password: params.password,
    role: "client",
    phone: params.phone.trim(),
    createdAt: now
  };

  mockUsers.push(newUser);

  return {
    token: tokenForUser(userId),
    user: toPublicUser(newUser)
  };
}

export function login(email: string, password: string): AuthSession | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = mockUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.password === password
  );

  if (!user) {
    return null;
  }

  return {
    token: tokenForUser(user.id),
    user: toPublicUser(user)
  };
}

export function googleLogin(params: {
  email: string;
  name: string;
  role: "client" | "business";
  businessName?: string;
  businessAddress?: string;
  businessCategory?: string;
}): AuthSession & { user: PublicUser } | { error: string } {
  const { email, name, role, businessName, businessAddress, businessCategory } = params;

  const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return {
      token: tokenForUser(existing.id),
      user: toPublicUser(existing)
    };
  }

  return register({ email, password: `google-${Date.now()}`, name, role, businessName, businessAddress, businessCategory });
}

export function getUserFromToken(token: string): PublicUser | null {
  const userId = token.replace("mock-token-", "");
  const user = mockUsers.find((candidate) => candidate.id === userId);

  return user ? toPublicUser(user) : null;
}
