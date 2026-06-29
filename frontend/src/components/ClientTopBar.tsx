import { useRouter } from "expo-router";
import { Bell, Menu } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { useNotifications } from "../hooks/useNotifications";

type ClientTopBarProps = {
  onMenuPress: () => void;
  onNotificationsPress?: () => void;
  unreadNotificationsCount?: number;
};

export function ClientTopBar({
  onMenuPress,
  onNotificationsPress,
  unreadNotificationsCount
}: ClientTopBarProps) {
  const router = useRouter();
  const shouldLoadUnreadCount = unreadNotificationsCount === undefined;
  const { unreadCount } = useNotifications({
    enabled: shouldLoadUnreadCount
  });
  const visibleUnreadCount = unreadNotificationsCount ?? unreadCount;
  const hasUnreadNotifications = visibleUnreadCount > 0;

  function handleNotificationsPress() {
    if (onNotificationsPress) {
      onNotificationsPress();
      return;
    }

    router.push("/(client)/notifications");
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Abrir menu"
        accessibilityRole="button"
        onPress={onMenuPress}
        style={styles.iconButton}
      >
        <Menu color={colors.text} size={24} />
      </Pressable>

      <Text style={styles.logo}>
        FOOD<Text style={styles.logoAccent}>SAVE</Text>
      </Text>

      <Pressable
        accessibilityLabel="Abrir notificaciones"
        accessibilityRole="button"
        onPress={handleNotificationsPress}
        style={styles.bellWrapper}
      >
        <Bell color={colors.text} size={22} />
        {hasUnreadNotifications ? (
          <View style={styles.notificationBadge}>
            {visibleUnreadCount > 9 ? (
              <Text style={styles.notificationBadgeText}>9+</Text>
            ) : visibleUnreadCount > 1 ? (
              <Text style={styles.notificationBadgeText}>
                {visibleUnreadCount}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bellWrapper: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.md
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  logo: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3
  },
  logoAccent: {
    color: colors.primary
  },
  notificationBadge: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 10,
    minWidth: 10,
    position: "absolute",
    right: 9,
    top: 9,
    justifyContent: "center",
    paddingHorizontal: 3
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11
  }
});
