import { apiRequest } from "./apiClient";
import type { AppNotification } from "../types/notification";

export async function getNotifications(token: string) {
  const response = await apiRequest<{ notifications: AppNotification[] }>(
    "/notifications",
    { token }
  );

  return response.notifications;
}

export async function markNotificationAsRead(
  token: string,
  notificationId: string
) {
  await apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    token
  });
}

export async function markAllNotificationsAsRead(token: string) {
  await apiRequest("/notifications/read-all", {
    method: "PATCH",
    token
  });
}

export async function deleteNotification(token: string, notificationId: string) {
  await apiRequest(`/notifications/${notificationId}`, {
    method: "DELETE",
    token
  });
}

export async function deleteAllNotifications(token: string) {
  await apiRequest("/notifications", {
    method: "DELETE",
    token
  });
}
