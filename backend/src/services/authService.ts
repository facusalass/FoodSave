import { mockUsers } from "../data/users.js";
import type { AuthSession, PublicUser } from "../types/auth.js";
import { toPublicUser } from "../utils/publicUser.js";

function tokenForUser(userId: string) {
  return `mock-token-${userId}`;
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

export function getUserFromToken(token: string): PublicUser | null {
  const userId = token.replace("mock-token-", "");
  const user = mockUsers.find((candidate) => candidate.id === userId);

  return user ? toPublicUser(user) : null;
}
