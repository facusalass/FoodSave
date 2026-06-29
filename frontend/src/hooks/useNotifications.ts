import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../services/notificationService";
import type { AppNotification } from "../types/notification";

type UseNotificationsOptions = {
  enabled?: boolean;
};

export function useNotifications({
  enabled = true
}: UseNotificationsOptions = {}) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!enabled || !session || session.user.role !== "client") {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const nextNotifications = await getNotifications(session.token);
      setNotifications(nextNotifications);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar tus notificaciones.";
      setError(message);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, session]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!session) {
        return;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      await markNotificationAsRead(session.token, notificationId);
    },
    [session]
  );

  const markAllAsRead = useCallback(async () => {
    if (!session) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true
      }))
    );

    await markAllNotificationsAsRead(session.token);
  }, [session]);

  return {
    error,
    isLoading,
    markAllAsRead,
    markAsRead,
    notifications,
    refresh: loadNotifications,
    unreadCount
  };
}
