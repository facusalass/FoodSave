import type { Request, Response } from "express";
import { getBusinessDashboardStats } from "../services/statisticsService.js";

export function getBusinessStatsController(
  request: Request,
  response: Response
) {
  const stats = getBusinessDashboardStats(request.user!.businessId!);
  response.json({ success: true, data: { stats } });
}
