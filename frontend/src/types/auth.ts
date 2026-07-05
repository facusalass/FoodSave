export type UserRole = "client" | "business";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  phone?: string;
  city?: string;
  address?: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type EmailConfirmationRequired = {
  emailConfirmationRequired: true;
  message: string;
};

export type RegisterResult = AuthSession | EmailConfirmationRequired;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  phone: string;
  email: string;
  password: string;
};
