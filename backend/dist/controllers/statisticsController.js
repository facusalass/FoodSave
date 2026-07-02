import { getBusinessDashboardStats } from "../services/statisticsService.js";
export async function getBusinessStatsController(request, response) {
    const stats = await getBusinessDashboardStats(request.user.businessId);
    response.json({ success: true, data: { stats } });
}
