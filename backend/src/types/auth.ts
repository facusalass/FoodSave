export type UserRole = "client" | "business";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  businessId?: string; 
  phone?: string;
  createdAt: string;   
};

export type Business = {
  id: string;
  name: string;
  ownerId: string;
  category: string;
  description: string;
  city: string;
  address: string;
  closingTime: string;
  logoUrl?: string;
  isActive: boolean;
  paymentInfo: {
    ownerName: string;
    cvu: string;
    alias: string;
  };
  createdAt: string;
};

export type PublicUser = Omit<User, "password">;

export type AuthSession = {
  token: string;
  user: PublicUser;
};