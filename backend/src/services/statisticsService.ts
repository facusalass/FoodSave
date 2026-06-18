import { mockReservations } from "../data/reservations.js";
import { mockOffers } from "../data/offers.js";
import type { BusinessDashboardStats, TopPublication } from "../types/statistics.js";

export function getBusinessDashboardStats(businessId: string): BusinessDashboardStats {
  // 1. Aislamiento Multi-tenant: Filtramos SOLO las reservas de ESTE negocio
  const businessReservations = mockReservations.filter(r => r.businessId === businessId);

  // 2. Variables acumuladoras
  let totalRevenue = 0;
  let totalBoxesSold = 0;
  let totalSavedKg = 0;
  let totalCancelled = 0;

  // Mapa auxiliar para agrupar las ventas por producto
  const publicationsMap: Record<string, { name: string; qty: number }> = {};

  // 3. Procesamiento de la Máquina de Estados
  businessReservations.forEach(reservation => {
    // Si se canceló, solo sumamos al contador de canceladas y pasamos de largo
    if (reservation.status === "cancelled") {
      totalCancelled++;
      return; 
    }

    // Si la venta es válida (pagada o retirada), procesamos los ingresos
    if (reservation.status === "picked_up" || reservation.status === "confirmed_paid") {
      totalRevenue += reservation.totalPrice;
      totalBoxesSold += reservation.quantity;

      // 4. El "JOIN" Lógico: Buscamos la oferta asociada para sacar el peso y el título
      const offer = mockOffers.find(o => o.id === reservation.offerId);

      if (offer) {
        // Sumamos los kilos (peso estimado de la oferta * cantidad de cajas reservadas)
        totalSavedKg += (offer.estimatedWeightInKg || 0) * reservation.quantity;

       // Sumamos a la estadística del top de publicaciones
        if (!publicationsMap[offer.id]) {
          publicationsMap[offer.id] = { name: offer.title, qty: 0 };
        }
        publicationsMap[offer.id]!.qty += reservation.quantity;
      }}
  });

  // 5. Convertimos el mapa a un array y lo ordenamos de mayor a menor para el ranking
  const topPublications: TopPublication[] = Object.values(publicationsMap)
    .map(pub => ({ offerName: pub.name, quantitySold: pub.qty }))
    .sort((a, b) => b.quantitySold - a.quantitySold);


  // En producción esto agruparía por la fecha 'createdAt', acá simulamos porcentajes del total
  const salesByWeek = [
    totalRevenue * 0.15,
    totalRevenue * 0.25,
    totalRevenue * 0.20,
    totalRevenue * 0.40 
  ];

  return {
    totalRevenue,
    totalSavedKg,
    totalBoxesSold,
    totalCancelled,
    salesByWeek,
    topPublications
  };
}