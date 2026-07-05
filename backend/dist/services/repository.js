import { supabase, supabaseAdmin } from "../config/supabase.js";
import { buildPaginatedResult } from "../utils/pagination.js";
// ── Helpers ────────────────────────────────────────
function asArray(data) { return (data ?? []); }
function single(data) { return data; }
// ── Users ─────────────────────────────────────────
export async function findUserByEmail(email) {
    const { data } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).single();
    return single(data);
}
export async function findUserById(id) {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    return single(data);
}
export async function updateClientProfileById(id, dataUpdate) {
    const { data, error } = await supabaseAdmin
        .from("users")
        .update(dataUpdate)
        .eq("id", id)
        .eq("role", "client")
        .select("*")
        .single();
    if (error)
        return null;
    return single(data);
}
// ── Businesses ────────────────────────────────────
export async function findBusinessById(id) {
    const { data } = await supabase.from("businesses").select("*").eq("id", id).single();
    return single(data);
}
export async function createBusinessRepo(business) {
    const { error } = await supabase.from("businesses").insert(business);
    if (error) {
        console.error("[createBusinessRepo]", JSON.stringify(error));
        return null;
    }
    const { data } = await supabase.from("businesses").select("*").eq("id", business.id).single();
    return data;
}
export async function updateBusinessById(id, data_update) {
    const { data, error } = await supabase.from("businesses").update(data_update).eq("id", id).select("*").single();
    if (error)
        return null;
    return single(data);
}
export async function setBusinessActive(id, isActive) {
    const { error } = await supabase.from("businesses").update({ isActive }).eq("id", id);
    return !error;
}
// ── Offers ────────────────────────────────────────
export async function listOffersRepo(filters) {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let businessIds;
    if (filters?.city) {
        const { data: cityBusinesses } = await supabase.from("businesses").select("id").eq("city", filters.city);
        businessIds = (cityBusinesses ?? []).map((b) => b.id);
    }
    let query = supabase.from("offers").select("*", { count: "exact" }).eq("isVisible", true);
    // Solo ofertas de negocios activos
    const { data: activeBusinesses } = await supabase.from("businesses").select("id").eq("isActive", true);
    const activeIds = (activeBusinesses ?? []).map((b) => b.id);
    if (activeIds.length > 0)
        query = query.in("businessId", activeIds);
    else
        return buildPaginatedResult([], 0, page, limit);
    if (businessIds && businessIds.length > 0)
        query = query.in("businessId", businessIds);
    else if (businessIds?.length === 0)
        return buildPaginatedResult([], 0, page, limit);
    if (filters?.category)
        query = query.ilike("category", `%${filters.category}%`);
    if (filters?.type)
        query = query.eq("type", filters.type);
    const { data, count } = await query.order("createdAt", { ascending: false }).range(from, to);
    return buildPaginatedResult(asArray(data), count ?? 0, page, limit);
}
export async function findOfferById(id) {
    const { data } = await supabase.from("offers").select("*").eq("id", id).single();
    return single(data);
}
export async function createOfferRepo(offer) {
    const { data, error } = await supabase.from("offers").insert(offer).select("*").single();
    if (error)
        return null;
    return data;
}
export async function updateOfferById(offerId, businessId, data_update) {
    const { data, error } = await supabase.from("offers").update(data_update).eq("id", offerId).eq("businessId", businessId).select("*").single();
    if (error)
        return null;
    return single(data);
}
export async function deleteOfferById(offerId, businessId) {
    const { error } = await supabase.from("offers").delete().eq("id", offerId).eq("businessId", businessId);
    return !error;
}
export async function listOffersByBusinessId(businessId) {
    const { data } = await supabase.from("offers").select("*").eq("businessId", businessId).order("createdAt", { ascending: false });
    return asArray(data);
}
// ── Reservations ──────────────────────────────────
export async function listReservationsByBusiness(businessId, page = 1, limit = 20) {
    return paginateReservations("businessId", businessId, page, limit);
}
export async function listReservationsByUser(userId, page = 1, limit = 20) {
    return paginateReservations("userId", userId, page, limit);
}
async function paginateReservations(column, value, page, limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count } = await supabase.from("reservations").select("*", { count: "exact" }).eq(column, value).order("createdAt", { ascending: false }).range(from, to);
    return buildPaginatedResult(asArray(data), count ?? 0, page, limit);
}
export async function findReservationById(id) {
    const { data } = await supabase.from("reservations").select("*").eq("id", id).single();
    return single(data);
}
export async function createReservationRepo(reservation) {
    const { data, error } = await supabase.from("reservations").insert(reservation).select("*").single();
    if (error)
        return null;
    return data;
}
export async function updateReservationStatusById(id, status) {
    const { data, error } = await supabase.from("reservations").update({ status }).eq("id", id).select("*").single();
    if (error)
        return null;
    return data;
}
// ── Favorites ─────────────────────────────────────
export async function listFavoritesByUser(userId) {
    const { data } = await supabase.from("favorites").select("offerId").eq("userId", userId);
    return asArray(data);
}
export async function addFavoriteRepo(userId, offerId) {
    const { error } = await supabase.from("favorites").insert({ userId, offerId });
    return !error;
}
export async function removeFavoriteRepo(userId, offerId) {
    const { error } = await supabase.from("favorites").delete().eq("userId", userId).eq("offerId", offerId);
    return !error;
}
export async function listNotificationsByUser(userId) {
    const { data } = await supabase.from("notifications").select("*").eq("userId", userId).order("createdAt", { ascending: false });
    return asArray(data);
}
export async function createNotification(notif) {
    const { error } = await supabase.from("notifications").insert(notif);
    return !error;
}
export async function markNotificationRead(id, userId) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id).eq("userId", userId);
    return !error;
}
export async function markAllNotificationsRead(userId) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("userId", userId).eq("read", false);
    return !error;
}
