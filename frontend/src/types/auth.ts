export type UserRole = "client" | "business";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  phone?: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
