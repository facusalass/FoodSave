export type TopPublication = {
  offerName: string;
  quantitySold: number;
};

export type BusinessDashboardStats = {
  totalRevenue: number;       
  totalSavedKg: number;       
  totalBoxesSold: number;     
  totalCancelled: number;    
  salesByWeek: number[];      
  topPublications: TopPublication[]; 
};