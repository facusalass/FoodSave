import { findUserById, updateClientProfileById } from "./repository.js";
import type { PublicUser } from "../types/auth.js";
import { toPublicUser } from "../utils/publicUser.js";

export type ClientProfile = Pick<
  PublicUser,
  "id" | "name" | "email" | "phone" | "city" | "address"
>;

export type ClientProfileInput = {
  name: string;
  phone?: string;
  city?: string;
  address?: string;
};

export async function getClientProfile(userId: string) {
  const user = await findUserById(userId);

  if (!user || user.role !== "client") {
    return null;
  }

  return toClientProfile(toPublicUser(user));
}

export async function updateClientProfile(
  userId: string,
  input: ClientProfileInput
) {
  const updated = await updateClientProfileById(userId, input);

  if (!updated) {
    return null;
  }

  return toClientProfile(toPublicUser(updated));
}

function toClientProfile(user: PublicUser): ClientProfile {
  return {
    address: user.address ?? "",
    city: user.city ?? "",
    email: user.email,
    id: user.id,
    name: user.name,
    phone: user.phone ?? ""
  };
}
