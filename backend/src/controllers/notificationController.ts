import type { Request, Response } from "express";
import { getNotifications, markAllRead, markRead } from "../services/notificationService.js";

export async function listNotificationsController(request: Request, response: Response) {
  const notifications = await getNotifications(request.user!.id);
  response.json({ success: true, data: { notifications } });
}

export async function markReadController(request: Request, response: Response) {
  const notifId = request.params.id;

  if (!notifId || Array.isArray(notifId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de notificación inválido." }
    });
    return;
  }

  const ok = await markRead(notifId, request.user!.id);

  if (!ok) {
    response.status(404).json({
      success: false,
      error: { message: "Notificación no encontrada." }
    });
    return;
  }

  response.json({ success: true, data: { message: "Notificación marcada como leída." } });
}

export async function markAllReadController(request: Request, response: Response) {
  await markAllRead(request.user!.id);
  response.json({ success: true, data: { message: "Todas las notificaciones marcadas como leídas." } });
}
