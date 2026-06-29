import type { Request, Response } from "express";
import { getBusinessDashboardStats } from "../services/statisticsService.js";

export async function getBusinessStatsController(
  request: Request,
  response: Response
) {
  const stats = await getBusinessDashboardStats(request.user!.businessId!);
  response.json({ success: true, data: { stats } });
}
