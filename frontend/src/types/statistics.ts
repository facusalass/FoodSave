export type BusinessStatistics = {
  boxesSold: number;
  cancelledCount: number;
  savedFoodKg: number | null;
  topOffers: Array<{
    offerId: string;
    soldCount: number;
    title: string;
  }>;
  totalRevenue: number;
  weeklySales: Array<{
    label: string;
    total: number;
  }>;
};
