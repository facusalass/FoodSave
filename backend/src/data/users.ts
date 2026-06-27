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
    name: "Carlos (Dueño)",
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
  },
  {
    id: "business-delicias",
    name: "Café & Delicias",
    ownerId: "user-business-1",
    category: "Panadería / Pastelería",
    description: "Café de especialidad y pastelería artesanal.",
    address: "Av. Alberdi 456",
    closingTime: "21:00",
    paymentInfo: {
      ownerName: "Carlos Dueño",
      cvu: "0000003100010123456790",
      alias: "CAFE.DELICIAS"
    },
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "business-rotiseria",
    name: "Pizzería Napolitana",
    ownerId: "user-business-1",
    category: "Rotisería",
    description: "Pizzas artesanales y cocina al horno de barro.",
    address: "Av. Italia 860",
    closingTime: "22:30",
    paymentInfo: {
      ownerName: "Carlos Dueño",
      cvu: "0000003100010123456791",
      alias: "PIZZA.NAPOLITANA"
    },
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "business-verde",
    name: "Verde Mercado",
    ownerId: "user-business-1",
    category: "Verdulería / Dietética",
    description: "Productos orgánicos y vegetarianos.",
    address: "French 340",
    closingTime: "20:30",
    paymentInfo: {
      ownerName: "Carlos Dueño",
      cvu: "0000003100010123456792",
      alias: "VERDE.MERCADO"
    },
    createdAt: "2026-06-01T10:00:00.000Z"
  }
];
