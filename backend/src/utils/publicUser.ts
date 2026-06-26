import type { PublicUser, User } from "../types/auth.js";

export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
