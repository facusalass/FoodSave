import type { OfferType } from "../types/offer";

export const OFFER_CATEGORIES = [
  "Panadería",
  "Rotisería",
  "Supermercado",
  "Cafetería",
  "Pizzería",
  "Verdulería",
  "Restaurante",
  "Heladería",
  "Varios"
] as const;

export type OfferCategory = (typeof OFFER_CATEGORIES)[number];

export const ALL_OFFERS_FILTER_LABEL = "Todos";
export const MYSTERY_BOX_FILTER_LABEL = "Mystery Box";

export type OfferCategoryFilter =
  | { label: typeof ALL_OFFERS_FILTER_LABEL; type: "all"; value: string }
  | { label: OfferCategory; type: "category"; value: OfferCategory }
  | { label: typeof MYSTERY_BOX_FILTER_LABEL; type: "type"; value: OfferType };

export const OFFER_CATEGORY_FILTERS: OfferCategoryFilter[] = [
  ...OFFER_CATEGORIES.map((category) => ({
    label: category,
    type: "category" as const,
    value: category
  })),
  {
    label: MYSTERY_BOX_FILTER_LABEL,
    type: "type",
    value: "mystery_box"
  }
];

const CATEGORY_ALIASES: Record<string, OfferCategory> = {
  cafe: "Cafetería",
  cafeteria: "Cafetería",
  facturas: "Panadería",
  heladeria: "Heladería",
  pan: "Panadería",
  panaderia: "Panadería",
  "panaderia pasteleria": "Panadería",
  pasteleria: "Panadería",
  pizza: "Pizzería",
  pizzeria: "Pizzería",
  productos: "Varios",
  "productos del dia": "Varios",
  "productos proximos a vencer": "Varios",
  restaurante: "Restaurante",
  rotiseria: "Rotisería",
  super: "Supermercado",
  supermercado: "Supermercado",
  varios: "Varios",
  verduleria: "Verdulería"
};

export function normalizeOfferCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCanonicalOfferCategory(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = normalizeOfferCategory(value);
  if (!normalizedValue) {
    return null;
  }

  const exactCategory = OFFER_CATEGORIES.find(
    (category) => normalizeOfferCategory(category) === normalizedValue
  );

  if (exactCategory) {
    return exactCategory;
  }

  return CATEGORY_ALIASES[normalizedValue] ?? null;
}

export function isControlledOfferCategory(
  value: string | undefined | null
): value is OfferCategory {
  return getCanonicalOfferCategory(value) === value;
}
