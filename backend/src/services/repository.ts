import { supabase } from "../config/supabase.js";
import type { Business, User } from "../types/auth.js";
import type { Offer } from "../types/offer.js";
import type { Reservation, ReservationStatus } from "../types/reservation.js";

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

export async function createUserRepo(user: User) {
  const { data, error } = await supabase
    .from("users")
    .insert(user as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw error;
  return data as User;
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

export async function updateBusinessById(
  id: string,
  data_update: Partial<Pick<Business, "name" | "category" | "description" | "address" | "closingTime" | "logoUrl">>
) {
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
}) {
  let query = supabase.from("offers").select("*");

  if (filters?.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const { data } = await query.order("createdAt", { ascending: false });
  return (data ?? []) as Offer[];
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

export async function updateOfferById(
  offerId: string,
  businessId: string,
  data_update: Partial<Pick<Offer, "title" | "description" | "category" | "type" | "oldPrice" | "newPrice" | "stock" | "pickupWindow" | "pickupLimit" | "allergens" | "imageUrl" | "estimatedWeightInKg">>
) {
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

export async function listReservationsByBusiness(businessId: string) {
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("businessId", businessId)
    .order("createdAt", { ascending: false });
  return (data ?? []) as Reservation[];
}

export async function listReservationsByUser(userId: string) {
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });
  return (data ?? []) as Reservation[];
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
