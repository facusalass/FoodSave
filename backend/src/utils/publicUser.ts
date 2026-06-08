import type { MockUser, PublicUser } from "../types/auth.js";

export function toPublicUser(user: MockUser): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
