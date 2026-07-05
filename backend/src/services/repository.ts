import { supabase } from "../config/supabase.js";
import { buildPaginatedResult, type PaginatedResult } from "../utils/pagination.js";
import type { Business, User } from "../types/auth.js";
import type { Offer } from "../types/offer.js";
import type { Reservation, ReservationStatus } from "../types/reservation.js";

export type BusinessUpdate = Partial<Pick<Business, "name" | "category" | "description" | "city" | "address" | "closingTime" | "logoUrl" | "paymentInfo">>;
export type OfferUpdate = Partial<Pick<Offer, "title" | "description" | "category" | "type" | "oldPrice" | "newPrice" | "stock" | "pickupWindow" | "pickupLimit" | "allergens" | "imageUrl" | "isVisible" | "estimatedWeightInKg">>;

// ── Helpers ────────────────────────────────────────

function asArray<T>(data: unknown) { return (data ?? []) as T[]; }
function single<T>(data: unknown) { return data as T | null; }

// ── Users ─────────────────────────────────────────

export async function findUserByEmail(email: string) {
  const { data } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).single();
  return single<User>(data);
}

export async function findUserById(id: string) {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return single<User>(data);
}

// ── Businesses ────────────────────────────────────

export async function findBusinessById(id: string) {
  const { data } = await supabase.from("businesses").select("*").eq("id", id).single();
  return single<Business>(data);
}

export async function createBusinessRepo(business: Business) {
  const { error } = await supabase.from("businesses").insert(business as Record<string, unknown>);
  if (error) {
    console.error("[createBusinessRepo]", JSON.stringify(error));
    return null;
  }
  const { data } = await supabase.from("businesses").select("*").eq("id", business.id).single();
  return data as Business | null;
}

export async function updateBusinessById(id: string, data_update: BusinessUpdate) {
  const { data, error } = await supabase.from("businesses").update(data_update as Record<string, unknown>).eq("id", id).select("*").single();
  if (error) return null;
  return single<Business>(data);
}

export async function setBusinessActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("businesses").update({ isActive }).eq("id", id);
  return !error;
}

// ── Offers ────────────────────────────────────────

export async function listOffersRepo(filters?: { category?: string; type?: string; city?: string; page?: number; limit?: number }): Promise<PaginatedResult<Offer>> {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let businessIds: string[] | undefined;
  if (filters?.city) {
    const { data: cityBusinesses } = await supabase.from("businesses").select("id").eq("city", filters.city);
    businessIds = (cityBusinesses ?? []).map((b: { id: string }) => b.id);
  }

  let query = supabase.from("offers").select("*", { count: "exact" }).eq("isVisible", true).gt("stock", 0);

  // Solo ofertas de negocios activos
  const { data: activeBusinesses } = await supabase.from("businesses").select("id").eq("isActive", true);
  const activeIds = (activeBusinesses ?? []).map((b: { id: string }) => b.id);
  if (activeIds.length > 0) query = query.in("businessId", activeIds);
  else return buildPaginatedResult([], 0, page, limit);
  if (businessIds && businessIds.length > 0) query = query.in("businessId", businessIds);
  else if (businessIds?.length === 0) return buildPaginatedResult([], 0, page, limit);
  if (filters?.category) query = query.ilike("category", `%${filters.category}%`);
  if (filters?.type) query = query.eq("type", filters.type);

  const { data, count } = await query.order("createdAt", { ascending: false }).range(from, to);
  return buildPaginatedResult(asArray<Offer>(data), count ?? 0, page, limit);
}

export async function findOfferById(id: string) {
  const { data } = await supabase.from("offers").select("*").eq("id", id).single();
  return single<Offer>(data);
}

export async function createOfferRepo(offer: Offer) {
  const { data, error } = await supabase.from("offers").insert(offer as Record<string, unknown>).select("*").single();
  if (error) return null;
  return data as Offer | null;
}

export async function updateOfferById(offerId: string, businessId: string, data_update: OfferUpdate) {
  const { data, error } = await supabase.from("offers").update(data_update as Record<string, unknown>).eq("id", offerId).eq("businessId", businessId).select("*").single();
  if (error) return null;
  return single<Offer>(data);
}

export async function deleteOfferById(offerId: string, businessId: string) {
  const { error } = await supabase.from("offers").delete().eq("id", offerId).eq("businessId", businessId);
  return !error;
}

export async function listOffersByBusinessId(businessId: string) {
  const { data } = await supabase.from("offers").select("*").eq("businessId", businessId).order("createdAt", { ascending: false });
  return asArray<Offer>(data);
}

// ── Reservations ──────────────────────────────────

export async function listReservationsByBusiness(businessId: string, page = 1, limit = 20) {
  return paginateReservations("businessId", businessId, page, limit);
}

export async function listReservationsByUser(userId: string, page = 1, limit = 20) {
  return paginateReservations("userId", userId, page, limit);
}

async function paginateReservations(column: "businessId" | "userId", value: string, page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count } = await supabase.from("reservations").select("*", { count: "exact" }).eq(column, value).order("createdAt", { ascending: false }).range(from, to);
  return buildPaginatedResult(asArray<Reservation>(data), count ?? 0, page, limit);
}

export async function findReservationById(id: string) {
  const { data } = await supabase.from("reservations").select("*").eq("id", id).single();
  return single<Reservation>(data);
}

export async function createReservationRepo(reservation: Reservation) {
  const { data, error } = await supabase.from("reservations").insert(reservation as Record<string, unknown>).select("*").single();
  if (error) return null;
  return data as Reservation | null;
}

export async function updateReservationStatusById(id: string, status: ReservationStatus) {
  const { data, error } = await supabase.from("reservations").update({ status }).eq("id", id).select("*").single();
  if (error) return null;
  return data as Reservation | null;
}

// ── Favorites ─────────────────────────────────────

export async function listFavoritesByUser(userId: string) {
  const { data } = await supabase.from("favorites").select("offerId").eq("userId", userId);
  return asArray<{ offerId: string }>(data);
}

export async function addFavoriteRepo(userId: string, offerId: string) {
  const { error } = await supabase.from("favorites").insert({ userId, offerId });
  return !error;
}

export async function removeFavoriteRepo(userId: string, offerId: string) {
  const { error } = await supabase.from("favorites").delete().eq("userId", userId).eq("offerId", offerId);
  return !error;
}

// ── Notifications ─────────────────────────────────

export type NotificationRow = { id: string; userId: string; type: string; title: string; message: string; reservationId: string; read: boolean; createdAt: string; };

export async function listNotificationsByUser(userId: string) {
  const { data } = await supabase.from("notifications").select("*").eq("userId", userId).order("createdAt", { ascending: false });
  return asArray<NotificationRow>(data);
}

export async function createNotification(notif: NotificationRow) {
  const { error } = await supabase.from("notifications").insert(notif as Record<string, unknown>);
  return !error;
}

export async function markNotificationRead(id: string, userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id).eq("userId", userId);
  return !error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("userId", userId).eq("read", false);
  return !error;
}
