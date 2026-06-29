import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getReservations } from "../services/reservationService";
import {
  buildInternalNotifications,
  loadReadNotificationIds,
  saveReadNotificationIds,
  type InternalNotification
} from "../utils/internalNotifications";

type UseInternalNotificationsOptions = {
  enabled?: boolean;
};

export function useInternalNotifications({
  enabled = true
}: UseInternalNotificationsOptions = {}) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!enabled || !session || session.user.role !== "client") {
      setNotifications([]);
      setReadIds(new Set());
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const [storedReadIds, reservations] = await Promise.all([
        loadReadNotificationIds(session.user.id),
        getReservations(session.token)
      ]);

      setReadIds(storedReadIds);
      setNotifications(
        buildInternalNotifications(reservations, storedReadIds)
      );
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
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!session) {
        return;
      }

      const nextReadIds = new Set(readIds);
      nextReadIds.add(notificationId);
      setReadIds(nextReadIds);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      await saveReadNotificationIds(session.user.id, nextReadIds);
    },
    [readIds, session]
  );

  return {
    error,
    isLoading,
    markAsRead,
    notifications,
    refresh: loadNotifications,
    unreadCount
  };
}
