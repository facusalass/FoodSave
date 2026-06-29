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
import { colors, radii, spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useInternalNotifications } from "../../src/hooks/useInternalNotifications";
import type {
  InternalNotification,
  InternalNotificationType
} from "../../src/utils/internalNotifications";

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const {
    error,
    isLoading,
    markAsRead,
    notifications,
    unreadCount
  } = useInternalNotifications();
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

  async function handleNotificationPress(notification: InternalNotification) {
    await markAsRead(notification.id);
    router.push("/(client)/reservations");
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
          <Text style={styles.unreadSummary}>
            {unreadCount === 1
              ? "1 nueva"
              : `${unreadCount} nuevas`}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
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
  notification: InternalNotification;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[
        styles.notificationCard,
        notification.isRead ? styles.readCard : styles.unreadCard
      ]}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(notification.type)}
      </View>

      <View style={styles.notificationBody}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text
            style={[
              styles.readStatus,
              notification.isRead ? styles.readStatusMuted : null
            ]}
          >
            {notification.isRead ? "Leída" : "No leída"}
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

function getNotificationIcon(type: InternalNotificationType): ReactNode {
  if (type === "reservation_expired") {
    return <AlertTriangle color={colors.warning} size={20} />;
  }

  if (type === "payment_confirmed") {
    return <CheckCircle2 color={colors.success} size={20} />;
  }

  if (type === "pickup_reminder") {
    return <Clock color={colors.info} size={20} />;
  }

  if (type === "reservation_created") {
    return <PackageCheck color={colors.primary} size={20} />;
  }

  return <Bell color={colors.secondaryDark} size={20} />;
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

const styles = StyleSheet.create({
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
    color: colors.mutedText,
    fontSize: 14
  },
  notificationBody: {
    flex: 1,
    gap: spacing.xs
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  notificationDate: {
    color: colors.mutedText,
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
    backgroundColor: colors.background,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  notificationMessage: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  notificationTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  readCard: {
    opacity: 0.78
  },
  readStatus: {
    color: colors.secondaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readStatusMuted: {
    color: colors.mutedText
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  unreadCard: {
    borderColor: "#14B8A666"
  },
  unreadSummary: {
    color: colors.secondaryDark,
    fontSize: 13,
    fontWeight: "900"
  }
});
