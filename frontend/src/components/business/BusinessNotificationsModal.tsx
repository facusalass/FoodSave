import { AlertTriangle, Clock, PackageCheck, X } from "lucide-react-native";
import { useEffect, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useBusinessNotifications } from "../../hooks/useBusinessNotifications";
import type {
  AppNotification,
  NotificationType
} from "../../types/notification";

type BusinessNotificationsModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function BusinessNotificationsModal({
  onClose,
  visible
}: BusinessNotificationsModalProps) {
  const { session } = useAuth();
  const { error, isLoading, notifications, refresh } =
    useBusinessNotifications({ enabled: visible });

  useEffect(() => {
    if (visible && session) {
      void refresh();
    }
  }, [refresh, session, visible]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>NOTIFICACIONES</Text>
            <TouchableOpacity
              accessibilityLabel="Cerrar notificaciones"
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X color={colors.text} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {isLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
              </View>
            ) : error ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyTitle}>No pudimos cargar los avisos.</Text>
                <Text style={styles.emptyText}>Proba de nuevo en unos segundos.</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyTitle}>Sin novedades por ahora.</Text>
                <Text style={styles.emptyText}>
                  Cuando haya reservas o avisos del local, los vas a ver aca.
                </Text>
              </View>
            ) : (
              notifications.slice(0, 3).map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Proximamente",
                  "La pantalla completa de notificaciones del comercio se va a habilitar mas adelante."
                )
              }
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>VER TODO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>{getNotificationIcon(notification.type)}</View>
      <Text numberOfLines={2} style={styles.message}>
        {notification.title || notification.message}
      </Text>
      {!notification.read ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}

function getNotificationIcon(type: NotificationType): ReactNode {
  if (type === "pickup_reminder") {
    return <Clock color={colors.text} size={21} />;
  }

  if (type === "reservation_expired") {
    return <AlertTriangle color={colors.text} size={21} />;
  }

  return <PackageCheck color={colors.text} size={21} />;
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  emptyBlock: {
    gap: spacing.xs,
    padding: spacing.md
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    minHeight: 64,
    justifyContent: "center"
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 62,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  list: {
    flex: 1
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
  message: {
    color: "#334155",
    flex: 1,
    fontSize: 15,
    lineHeight: 20
  },
  overlay: {
    backgroundColor: "#00000022",
    flex: 1
  },
  panel: {
    alignSelf: "flex-end",
    backgroundColor: colors.card,
    flex: 1,
    maxWidth: 390,
    width: "100%"
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 69,
    paddingHorizontal: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  unreadDot: {
    backgroundColor: "#F43F5E",
    borderRadius: 4,
    height: 8,
    width: 8
  },
  viewAllButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  }
});
