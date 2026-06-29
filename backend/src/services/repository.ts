import { supabase } from "../config/supabase.js";
import { buildPaginatedResult, type PaginatedResult } from "../utils/pagination.js";
import type { Business, User } from "../types/auth.js";
import type { Offer } from "../types/offer.js";
import type { Reservation, ReservationStatus } from "../types/reservation.js";

export type BusinessUpdate = Partial<Pick<Business, "name" | "category" | "description" | "city" | "address" | "closingTime" | "logoUrl">>;
export type OfferUpdate = Partial<Pick<Offer, "title" | "description" | "category" | "type" | "oldPrice" | "newPrice" | "stock" | "pickupWindow" | "pickupLimit" | "allergens" | "imageUrl" | "estimatedWeightInKg">>;

/* ── Users ───────────────────────────────────────── */

export async function findUserByEmail(email: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  return data as User | null;
}

export async function findUserById(id: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data as User | null;
}

/* ── Businesses ──────────────────────────────────── */

export async function findBusinessById(id: string) {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();
  return data as Business | null;
}

export async function createBusinessRepo(business: Business) {
  const { data, error } = await supabase
    .from("businesses")
    .insert(business as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw error;
  return data as Business;
}

export async function updateBusinessById(id: string, data_update: BusinessUpdate) {
  const { data, error } = await supabase
    .from("businesses")
    .update(data_update as Record<string, unknown>)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return null;
  return data as Business | null;
}

/* ── Offers ──────────────────────────────────────── */

export async function listOffersRepo(filters?: {
  category?: string;
  type?: string;
  city?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<Offer>> {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let businessIds: string[] | undefined;

  if (filters?.city) {
    const { data: cityBusinesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("city", filters.city);
    businessIds = (cityBusinesses ?? []).map((b) => b.id);
  }

  let query = supabase.from("offers").select("*", { count: "exact" });

  if (businessIds && businessIds.length > 0) {
    query = query.in("businessId", businessIds);
  } else if (businessIds?.length === 0) {
    return buildPaginatedResult([], 0, page, limit);
  }

  if (filters?.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const { data, count } = await query
    .order("createdAt", { ascending: false })
    .range(from, to);

  return buildPaginatedResult(
    (data ?? []) as Offer[],
    count ?? 0,
    page,
    limit
  );
}

export async function findOfferById(id: string) {
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .single();
  return data as Offer | null;
}

export async function createOfferRepo(offer: Offer) {
  const { data, error } = await supabase
    .from("offers")
    .insert(offer as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw error;
  return data as Offer;
}

export async function updateOfferById(offerId: string, businessId: string, data_update: OfferUpdate) {
  const { data, error } = await supabase
    .from("offers")
    .update(data_update as Record<string, unknown>)
    .eq("id", offerId)
    .eq("businessId", businessId)
    .select("*")
    .single();
  if (error) return null;
  return data as Offer | null;
}

export async function deleteOfferById(offerId: string, businessId: string) {
  const { error } = await supabase
    .from("offers")
    .delete()
    .eq("id", offerId)
    .eq("businessId", businessId);
  return !error;
}

/* ── Reservations ────────────────────────────────── */

async function paginateReservations(column: "businessId" | "userId", value: string, page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("reservations")
    .select("*", { count: "exact" })
    .eq(column, value)
    .order("createdAt", { ascending: false })
    .range(from, to);

  return buildPaginatedResult((data ?? []) as Reservation[], count ?? 0, page, limit);
}

export function listReservationsByBusiness(businessId: string, page = 1, limit = 20) {
  return paginateReservations("businessId", businessId, page, limit);
}

export function listReservationsByUser(userId: string, page = 1, limit = 20) {
  return paginateReservations("userId", userId, page, limit);
}

export async function findReservationById(id: string) {
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();
  return data as Reservation | null;
}

export async function createReservationRepo(reservation: Reservation) {
  const { data, error } = await supabase
    .from("reservations")
    .insert(reservation as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw error;
  return data as Reservation;
}

export async function updateReservationStatusById(id: string, status: ReservationStatus) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Reservation;
}

/* ── Favorites ───────────────────────────────────── */

export async function listFavoritesByUser(userId: string) {
  const { data } = await supabase
    .from("favorites")
    .select("offerId")
    .eq("userId", userId);
  return (data ?? []) as { offerId: string }[];
}

export async function addFavoriteRepo(userId: string, offerId: string) {
  const { error } = await supabase
    .from("favorites")
    .insert({ userId, offerId });
  return !error;
}

export async function removeFavoriteRepo(userId: string, offerId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("userId", userId)
    .eq("offerId", offerId);
  return !error;
}
