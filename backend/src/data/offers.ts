import type { Offer } from "../types/offer.js";

export const mockOffers: Offer[] = [
  {
    id: "offer-1",
    businessId: "business-espiga",
    title: "Mystery Box Panadería",
    description: "Mystery Box de productos de panadería",
    category: "Panadería",
    type: "mystery_box",
    oldPrice: 3000,
    newPrice: 1500,
    stock: 5,
    pickupWindow: "18:00 - 22:00",
    pickupLimit: "22:00 hs",
    allergens: ["TACC", "Lácteos"],
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-06-15T10:00:00.000Z",
    estimatedWeightInKg: 1.5
  },
  {
    id: "offer-2",
    businessId: "business-delicias",
    title: "Productos próximos a vencer",
    description: "Productos del día",
    category: "SuperMercado",
    type: "standard",
    oldPrice: 2500,
    newPrice: 1200,
    stock: 3,
    pickupWindow: "19:00 - 21:00",
    pickupLimit: "21:00 hs",
    allergens: ["Lácteos"],
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-06-15T11:30:00.000Z",
    estimatedWeightInKg: 0.8
  },
  {
    id: "offer-3",
    businessId: "business-rotiseria",
    title: "Pizza del día + bebida",
    description: "Pizza del día + bebida",
    category: "Rotisería",
    type: "standard",
    oldPrice: 4000,
    newPrice: 2000,
    stock: 4,
    pickupWindow: "20:00 - 22:30",
    pickupLimit: "22:30 hs",
    allergens: ["Consultar en local"],
    imageUrl:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-06-16T09:15:00.000Z",
    estimatedWeightInKg: 1.2
  },
  {
    id: "offer-4",
    businessId: "business-verde",
    title: "Combo vegetariano",
    description: "Combo vegetariano de excedentes frescos",
    category: "Mystery Box",
    type: "mystery_box",
    oldPrice: 4800,
    newPrice: 2600,
    stock: 2,
    pickupWindow: "17:30 - 20:30",
    pickupLimit: "20:30 hs",
    allergens: ["Frutos secos"],
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-06-16T14:20:00.000Z",
    estimatedWeightInKg: 1.0
  }
];
