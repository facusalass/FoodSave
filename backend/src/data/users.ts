import type { User, Business } from "../types/auth.js";

export const mockUsers: User[] = [
  {
    id: "user-client-1",
    name: "Mateo Cliente",
    email: "cliente@foodsave.com",
    password: "123456",
    role: "client",
    phone: "+54 9 362 1234567",
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "user-business-1",
    name: "Carlos (Dueño)", // El nombre real de la persona
    email: "comercio@foodsave.com",
    password: "123456",
    role: "business",
    businessId: "business-espiga",
    phone: "+54 9 362 4567890",
    createdAt: "2026-06-01T10:00:00.000Z"
  }
];
export const mockBusinesses: Business[] = [
  {
    id: "business-espiga",
    name: "Panadería La Espiga", 
    ownerId: "user-business-1",  
    category: "Panadería / Pastelería",
    description: "Especialistas en facturas y panificados.",
    address: "Av. San Martín 123", 
    closingTime: "22:00",
    paymentInfo: {
      ownerName: "Carlos Dueño",
      cvu: "0000003100010123456789",
      alias: "PANADERIA.ESPIGA"
    },
    createdAt: "2026-06-01T10:00:00.000Z"
  }
];