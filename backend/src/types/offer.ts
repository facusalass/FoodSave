export type OfferType = "mystery_box" | "standard";

export type Offer = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: string;
  type: OfferType;
  oldPrice: number;
  newPrice: number;
  stock: number;
  pickupWindow: string;
  pickupLimit: string;
  allergens: string[];
  imageUrl: string;
  createdAt: string;
  estimatedWeightInKg?: number;
};
