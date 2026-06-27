export type OfferType = "mystery_box" | "standard";

export type Offer = {
  id: string;
  businessId: string;
  storeName: string;
  storeAddress: string;
  logoUrl?: string;
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
  address?: string;
  city?: string;
  imageUrl: string;
};
