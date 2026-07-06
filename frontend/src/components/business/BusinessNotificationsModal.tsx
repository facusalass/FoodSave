import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageCheck,
  Trash2,
  X
} from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { type AppColors, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { deleteAll, deleteById, error, isLoading, notifications, refresh } =
    useBusinessNotifications({ enabled: visible });
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (visible && session) {
      void refresh();
    }
  }, [refresh, session, visible]);

  async function handleDeleteNotification(notificationId: string) {
    try {
      setDeletingNotificationId(notificationId);
      await deleteById(notificationId);
    } catch {
      Alert.alert("No pudimos borrar la notificacion", "Proba de nuevo en unos segundos.");
    } finally {
      setDeletingNotificationId(null);
    }
  }

  function handleDeleteAllNotifications() {
    Alert.alert(
      "Borrar notificaciones",
      "Se van a eliminar todas las notificaciones del panel.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () => {
            void deleteAllNotifications();
          },
          style: "destructive",
          text: "Borrar"
        }
      ]
    );
  }

  async function deleteAllNotifications() {
    try {
      setIsDeletingAll(true);
      await deleteAll();
    } catch {
      Alert.alert("No pudimos borrar las notificaciones", "Proba de nuevo en unos segundos.");
    } finally {
      setIsDeletingAll(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>NOTIFICACIONES</Text>
            <View style={styles.headerActions}>
              {notifications.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isDeletingAll}
                  onPress={handleDeleteAllNotifications}
                  style={[styles.clearButton, isDeletingAll ? styles.disabledButton : null]}
                >
                  {isDeletingAll ? (
                    <ActivityIndicator color={theme.danger} size="small" />
                  ) : (
                    <Text style={styles.clearButtonText}>Borrar todas</Text>
                  )}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Cerrar notificaciones"
                accessibilityRole="button"
                activeOpacity={0.85}
                onPress={onClose}
                style={styles.closeButton}
              >
                <X color={theme.text} size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.list}>
            {isLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.primary} />
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
                  isDeleting={deletingNotificationId === notification.id}
                  notification={notification}
                  onDelete={() => {
                    void handleDeleteNotification(notification.id);
                  }}
                  theme={theme}
                  styles={styles}
                />
              ))
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

function NotificationRow({
  isDeleting,
  notification,
  onDelete,
  styles,
  theme
}: {
  isDeleting: boolean;
  notification: AppNotification;
  onDelete: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppColors;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>{getNotificationIcon(notification.type, theme)}</View>
      <Text numberOfLines={2} style={styles.message}>
        {notification.title || notification.message}
      </Text>
      {!notification.read ? <View style={styles.unreadDot} /> : null}
      <TouchableOpacity
        accessibilityLabel="Borrar notificacion"
        accessibilityRole="button"
        activeOpacity={0.85}
        disabled={isDeleting}
        onPress={onDelete}
        style={styles.deleteButton}
      >
        {isDeleting ? (
          <ActivityIndicator color={theme.danger} size="small" />
        ) : (
          <Trash2 color={theme.danger} size={18} />
        )}
      </TouchableOpacity>
    </View>
  );
}

function getNotificationIcon(type: NotificationType, theme: AppColors): ReactNode {
  if (type === "payment_received") {
    return <CheckCircle2 color={theme.secondaryDark} size={21} />;
  }

  if (type === "reservation_received") {
    return <PackageCheck color={theme.primary} size={21} />;
  }

  if (type === "pickup_reminder") {
    return <Clock color={theme.text} size={21} />;
  }

  if (type === "reservation_expired") {
    return <AlertTriangle color={theme.text} size={21} />;
  }

  return <PackageCheck color={theme.text} size={21} />;
}

function createStyles(theme: AppColors) {
  return StyleSheet.create({
  closeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  clearButton: {
    alignItems: "center",
    borderColor: `${theme.danger}4D`,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  clearButtonText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: "900"
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  disabledButton: {
    opacity: 0.64
  },
  emptyBlock: {
    gap: spacing.xs,
    padding: spacing.md
  },
  emptyText: {
    color: theme.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  header: {
    alignItems: "center",
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 62,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs,
    justifyContent: "flex-end"
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: theme.subtleSurface,
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
    color: theme.mutedText,
    fontSize: 14
  },
  message: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 20
  },
  overlay: {
    backgroundColor: theme.overlay,
    flex: 1
  },
  panel: {
    alignSelf: "flex-end",
    backgroundColor: theme.card,
    flex: 1,
    maxWidth: 390,
    width: "100%"
  },
  row: {
    alignItems: "center",
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 69,
    paddingHorizontal: spacing.md
  },
  title: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "900"
  },
  unreadDot: {
    backgroundColor: "#F43F5E",
    borderRadius: 4,
    height: 8,
    width: 8
  },
  });
}
