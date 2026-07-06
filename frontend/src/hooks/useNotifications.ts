import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../services/notificationService";
import {
  isClientNotificationType,
  type AppNotification
} from "../types/notification";

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
      setNotifications(
        nextNotifications.filter((notification) =>
          isClientNotificationType(notification.type)
        )
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

  const deleteById = useCallback(
    async (notificationId: string) => {
      if (!session) {
        return;
      }

      let previousNotifications: AppNotification[] = [];

      setNotifications((currentNotifications) => {
        previousNotifications = currentNotifications;
        return currentNotifications.filter(
          (notification) => notification.id !== notificationId
        );
      });

      try {
        await deleteNotification(session.token, notificationId);
      } catch (deleteError) {
        setNotifications(previousNotifications);
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "No pudimos borrar la notificacion."
        );
        throw deleteError;
      }
    },
    [session]
  );

  const deleteAll = useCallback(async () => {
    if (!session) {
      return;
    }

    let previousNotifications: AppNotification[] = [];

    setNotifications((currentNotifications) => {
      previousNotifications = currentNotifications;
      return [];
    });

    try {
      await deleteAllNotifications(session.token);
    } catch (deleteError) {
      setNotifications(previousNotifications);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No pudimos borrar las notificaciones."
      );
      throw deleteError;
    }
  }, [session]);

  return {
    deleteAll,
    deleteById,
    error,
    isLoading,
    markAllAsRead,
    markAsRead,
    notifications,
    refresh: loadNotifications,
    unreadCount
  };
}
