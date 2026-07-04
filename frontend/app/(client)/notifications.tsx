import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  PackageCheck
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  ClientSideMenu,
  type ClientMenuRoute
} from "../../src/components/ClientSideMenu";
import { ClientTopBar } from "../../src/components/ClientTopBar";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { type AppColors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useNotifications } from "../../src/hooks/useNotifications";
import type {
  AppNotification,
  NotificationType
} from "../../src/types/notification";

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    error,
    isLoading,
    markAllAsRead,
    markAsRead,
    notifications,
    unreadCount
  } = useNotifications();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  function handleNavigate(route: ClientMenuRoute) {
    setIsMenuVisible(false);
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    setIsMenuVisible(false);
    router.replace("/(auth)/login");
  }

  async function handleNotificationPress(notification: AppNotification) {
    await markAsRead(notification.id);

    if (notification.reservationId) {
      router.push("/(client)/reservations");
    }
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <ClientTopBar
        onMenuPress={() => setIsMenuVisible(true)}
        unreadNotificationsCount={unreadCount}
      />
      <ClientSideMenu
        onClose={() => setIsMenuVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        visible={isMenuVisible}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              void handleMarkAllAsRead();
            }}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      ) : error ? (
        <EmptyState
          description={error}
          title="No pudimos cargar notificaciones"
        />
      ) : notifications.length === 0 ? (
        <EmptyState title="No tenés notificaciones por ahora." />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => {
                void handleNotificationPress(notification);
              }}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function NotificationCard({
  notification,
  onPress
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[
        styles.notificationCard,
        notification.read ? styles.readCard : styles.unreadCard
      ]}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(notification.type, theme)}
      </View>

      <View style={styles.notificationBody}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text
            style={[
              styles.readStatus,
              notification.read ? styles.readStatusMuted : null
            ]}
          >
            {notification.read ? "Leída" : "No leída"}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationDate}>
          {formatNotificationDate(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getNotificationIcon(type: NotificationType, theme: AppColors): ReactNode {
  if (type === "reservation_expired") {
    return <AlertTriangle color={theme.warning} size={20} />;
  }

  if (type === "payment_confirmed") {
    return <CheckCircle2 color={theme.success} size={20} />;
  }

  if (type === "pickup_reminder") {
    return <Clock color={theme.info} size={20} />;
  }

  if (type === "reservation_created") {
    return <PackageCheck color={theme.primary} size={20} />;
  }

  return <Bell color={theme.secondaryDark} size={20} />;
}

function formatNotificationDate(value?: string) {
  if (!value) {
    return "Hace instantes";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Hace instantes";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(date);
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  list: {
    gap: spacing.md
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: theme.mutedText,
    fontSize: 14
  },
  notificationBody: {
    flex: 1,
    gap: spacing.xs
  },
  notificationCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  notificationDate: {
    color: theme.mutedText,
    fontSize: 12,
    fontWeight: "700"
  },
  notificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  notificationMessage: {
    color: theme.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  notificationTitle: {
    color: theme.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  readCard: {
    opacity: 0.78
  },
  readStatus: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readStatusMuted: {
    color: theme.mutedText
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900"
  },
  unreadCard: {
    borderColor: `${theme.secondary}66`
  },
  markAllButton: {
    backgroundColor: `${theme.secondary}1A`,
    borderColor: `${theme.secondary}4D`,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  markAllText: {
    color: theme.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  }
  });
}

