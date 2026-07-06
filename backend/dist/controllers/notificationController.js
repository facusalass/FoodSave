import { deleteAllNotifications, deleteNotification, getNotifications, markAllRead, markRead } from "../services/notificationService.js";
export async function listNotificationsController(request, response) {
    const notifications = await getNotifications(request.user.id);
    response.json({ success: true, data: { notifications } });
}
export async function markReadController(request, response) {
    const notifId = request.params.id;
    if (!notifId || Array.isArray(notifId)) {
        response.status(400).json({
            success: false,
            error: { message: "ID de notificacion invalido." }
        });
        return;
    }
    const ok = await markRead(notifId, request.user.id);
    if (!ok) {
        response.status(404).json({
            success: false,
            error: { message: "Notificacion no encontrada." }
        });
        return;
    }
    response.json({ success: true, data: { message: "Notificacion marcada como leida." } });
}
export async function markAllReadController(request, response) {
    await markAllRead(request.user.id);
    response.json({ success: true, data: { message: "Todas las notificaciones marcadas como leidas." } });
}
export async function deleteNotificationController(request, response) {
    const notifId = request.params.id;
    if (!notifId || Array.isArray(notifId)) {
        response.status(400).json({
            success: false,
            error: { message: "ID de notificacion invalido." }
        });
        return;
    }
    const ok = await deleteNotification(notifId, request.user.id);
    if (!ok) {
        response.status(404).json({
            success: false,
            error: { message: "Notificacion no encontrada." }
        });
        return;
    }
    response.json({ success: true, data: { message: "Notificacion eliminada." } });
}
export async function deleteAllNotificationsController(request, response) {
    await deleteAllNotifications(request.user.id);
    response.json({ success: true, data: { message: "Notificaciones eliminadas." } });
}
