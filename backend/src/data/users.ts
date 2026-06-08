import type { MockUser } from "../types/auth.js";

export const mockUsers: MockUser[] = [
  {
    id: "user-client-1",
    name: "Mateo Cliente",
    email: "cliente@foodsave.com",
    password: "123456",
    role: "client",
    phone: "+54 9 362 1234567"
  },
  {
    id: "user-business-1",
    name: "Panadería La Espiga",
    email: "comercio@foodsave.com",
    password: "123456",
    role: "business",
    businessId: "business-espiga",
    phone: "+54 9 362 4567890"
  }
];
