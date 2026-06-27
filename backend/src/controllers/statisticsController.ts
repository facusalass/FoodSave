import type { Request, Response } from "express";
import { getBusinessDashboardStats } from "../services/statisticsService.js";

export function getBusinessStatsController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    response.status(401).json({
      success: false,
      error: { message: "Usuario no autenticado." }
    });
    return;
  }

  if (request.user.role !== "business" || !request.user.businessId) {
    response.status(403).json({
      success: false,
      error: { message: "Solo los comercios pueden acceder a las estadísticas." }
    });
    return;
  }

  const stats = getBusinessDashboardStats(request.user.businessId);
  response.json({ success: true, data: { stats } });
}
