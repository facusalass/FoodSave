import { listOffersRepo, listReservationsByBusiness } from "./repository.js";
import type { BusinessDashboardStats, TopPublication } from "../types/statistics.js";

export async function getBusinessDashboardStats(businessId: string): Promise<BusinessDashboardStats> {
  const { items: reservations } = await listReservationsByBusiness(businessId, 1, 10000);
  const { items: offers } = await listOffersRepo({ limit: 10000 });

  let totalRevenue = 0;
  let totalBoxesSold = 0;
  let totalSavedKg = 0;
  let totalCancelled = 0;

  const publicationsMap: Record<string, { name: string; qty: number }> = {};
  const weeklyRevenue = [0, 0, 0, 0];
  const now = new Date();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  for (const r of reservations) {
    if (r.status === "cancelled") {
      totalCancelled++;
      continue;
    }

    if (r.status === "picked_up" || r.status === "confirmed_paid") {
      totalRevenue += r.totalPrice;
      totalBoxesSold += r.quantity;

      // Agrupar por semana: 0 = esta semana, 1 = anterior, etc.
      const createdAt = new Date(r.createdAt);
      const weekIndex = Math.floor((now.getTime() - createdAt.getTime()) / oneWeek);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeklyRevenue[weekIndex]! += r.totalPrice;
      }

      const offer = offers.find((o) => o.id === r.offerId);
      if (offer) {
        totalSavedKg += (offer.estimatedWeightInKg || 0) * r.quantity;

        if (!publicationsMap[offer.id]) {
          publicationsMap[offer.id] = { name: offer.title, qty: 0 };
        }
        publicationsMap[offer.id]!.qty += r.quantity;
      }
    }
  }

  const topPublications: TopPublication[] = Object.values(publicationsMap)
    .map((p) => ({ offerName: p.name, quantitySold: p.qty }))
    .sort((a, b) => b.quantitySold - a.quantitySold);

  return { totalRevenue, totalSavedKg, totalBoxesSold, totalCancelled, salesByWeek: weeklyRevenue.reverse(), topPublications };
}
