export type UserRole = "client" | "business";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: string;
  phone?: string;
};

export type PublicUser = Omit<MockUser, "password">;

export type AuthSession = {
  token: string;
  user: PublicUser;
};
